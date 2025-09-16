import mongoose, { ClientSession, Types } from 'mongoose';
import { TProfile, TUser, TFriend, TCategory } from './user.interface';
import { CategoryModel, ProfileModel, UserModel } from './user.model';
import {
  uploadImgToCloudinary,
} from '../../util/uploadImgToCloudinary';
import authUtil from '../auth/auth.util';
import { userRole } from '../../constants';
import updateGroupAndTransactions from './userUtill';
import { ExpenseOrIncomeGroupModel } from '../incomeAndExpances/incomeAndexpence.model';
import { GroupTransactionModel } from '../groupTransection/groupTransection.model';

const createUser = async (payload: Partial<TUser>) => {

  // Check for existing user
  const existingUser = await UserModel.findOne({ email: payload.email }).select(
    '+password',
  );
  if (existingUser && !existingUser.isDeleted) {
    throw new Error('A user with this email already exists and is active.');
  }

  // Create new payload with default role
  const userPayload = {
    ...payload,
    role: payload.role || userRole.user,
  };

  // Remove confirmPassword from payload
  const { ...userData } = userPayload;

  // Check MongoDB connection state
  if (mongoose.connection.readyState !== 1) {
    console.error(
      'MongoDB connection not ready, state:',
      mongoose.connection.readyState,
    );
    throw new Error('MongoDB connection is not ready.');
  }

  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    let imageUrl: string | undefined;

    // Optional: Upload image to Cloudinary if file is provided

    // Add image URL to userData if available
    const userDataWithImg = {
      ...userData,
      ...(imageUrl && { img: imageUrl }),
    };


    console.log('Creating user with data:', userDataWithImg);


    const created = await UserModel.create([userDataWithImg], { session });
    const user = created[0];

    console.log('User created:', user._id);

    // Find groups where the user's email exists in groupMemberList and isDeleted is false
    const groups = await ExpenseOrIncomeGroupModel.find(
      {
        'groupMemberList.email': userData.email,
        isDeleted: false,
      },
      { _id: 1 },
      { session },
    );
    const groupIds = groups.map((group) => group._id);

    // Create profile with groupList populated
    const profileCreation = await ProfileModel.create(
      [
        {
          name: userData.name ?? 'user',
          phone: userData.phone,
          email: userData.email!,
          user_id: user._id,
          img:
            imageUrl ||
            'https://res.cloudinary.com/dpgcpei5u/image/upload/v1747546759/interviewProfile_jvo9jl.jpg',
          groupList: groupIds,
          aiChatCount: 100,
          maxGroups: 3,
          totalCreatedGroups: 0,
          assistantType: null,
          startDate: null,
          endDate: null,
          emailNotification: false,
          isDeleted: false,
        },
      ],
      { session },
    );

    // Update group members and transactions with the new user ID
    const updateResult = await updateGroupAndTransactions(
      userData.email!,
      user._id,
      session,
    );
    console.log('Group and transaction update result:', updateResult);

    // Commit the transaction
    await session.commitTransaction();
    console.log('Transaction committed');

    // Fetch the user after transaction
    let fetchedUser = await UserModel.findOne({
      email: userData.email,
    }).select('-password');
    if (!fetchedUser) {
      throw new Error('User created but not found after transaction.');
    }

    const userObj = fetchedUser.toObject();
    const profileObj = profileCreation[0]?.toObject();
    const mergedUser = { ...userObj, ...profileObj };

    // Send OTP
    console.log('Sending OTP via email');
    const token = await authUtil.sendOTPViaEmail(fetchedUser);

    return {
      success: true,
      user: mergedUser,
      token: token.token || null,
      groupUpdate: {
        modifiedGroups: updateResult.modifiedGroups,
        modifiedTransactions: updateResult.modifiedTransactions,
      },
      addedGroups: groupIds,
    };
  } catch (error: any) {
    await session.abortTransaction();
    console.error('Transaction failed:', error);



    throw new Error(
      error.message ||
      'User creation, profile update, or group/transaction update failed due to an internal error.',
    );
  } finally {
    session.endSession();
    console.log('Session ended');
  }
};

const setFCMToken = async (user_id: Types.ObjectId, fcmToken: string) => {
  if (!fcmToken) {
    throw new Error('fcm token is required');
  }

  const result = await UserModel.findOneAndUpdate(
    {
      _id: user_id,
    },
    {
      fcmToken: fcmToken,
    },
    { new: true },
  );

  return result;
};

const getAllUsers = async () => {
  const result = await UserModel.find({ isBlocked: false, isDeleted: false });
  return result;
};

const getAllProfiles = async () => {
  // Assuming you have a Profile model, fetch all profiles
  const profiles = await ProfileModel.find({});
  return profiles;
};

// update profile with profile image
const updateUserProfile = async (
  user_id: Types.ObjectId, // MongoDB default _id is of type ObjectId
  payload?: Partial<TProfile>,
  imgFile?: Express.Multer.File, // imgFile is optional now
) => {
  const updatedProfileData = { ...payload }; // Start with the existing payload

  // If imgFile is provided, upload it to Cloudinary
  if (imgFile) {
    try {
      const imageUploadResult = await uploadImgToCloudinary(
        `profile-${user_id.toString()}`, // Custom name for the image
        imgFile.path, // Path to the uploaded image
      );

      // Add the image URL to the updated profile data
      updatedProfileData.img = imageUploadResult.secure_url;
    } catch (error: any) {
      throw new Error('Error uploading image: ' + error.message);
    }
  }

  // Now update the profile with the provided data (including the image if uploaded)
  try {
    const updatedProfile = await ProfileModel.findOneAndUpdate(
      { user_id },
      { $set: updatedProfileData },
      { new: true }, // Return the updated document
    );

    return updatedProfile;
  } catch (error: any) {
    throw new Error('Profile update failed: ' + error.message);
  }
};

const updateProfileData = async (
  user_id: Types.ObjectId,
  payload: Partial<TProfile>,
) => {
  try {
    const updatedProfile = await ProfileModel.findOneAndUpdate(
      { user_id },
      { $set: payload },
      { new: true },
    );

    // if profile was updated successfully, also update User schema
    if (updatedProfile) {
      await UserModel.findByIdAndUpdate(user_id, {
        $set: { isProfileUpdated: true },
      });
    }

    return updatedProfile;
  } catch (error) {
    throw error;
  }
};

const deleteSingleUser = async (user_id: Types.ObjectId) => {
  const session: ClientSession = await mongoose.startSession();
  session.startTransaction();

  try {
    // Validate user_id
    if (!Types.ObjectId.isValid(user_id)) {
      throw new Error('Invalid user ID provided');
    }

    // Update the UserModel
    const updatedUser = await UserModel.findOneAndUpdate(
      { _id: user_id },
      { isDeleted: true, email: null },
      { new: true, session }, // Return the updated document
    );

    if (!updatedUser) {
      throw new Error('User not found');
    }

    // Update the ProfileModel
    const updatedProfile = await ProfileModel.findOneAndUpdate(
      { user_id },
      { isDeleted: true, email: null },
      { new: true, session }, // Return the updated document
    );

    if (!updatedProfile) {
      throw new Error('Profile not found for the user');
    }

    // Commit the transaction
    await session.commitTransaction();

    return {
      success: true,
      message: 'User and associated profile deleted successfully',
      data: {
        userId: user_id,
        updatedUser,
        updatedProfile,
      },
    };
  } catch (error: any) {
    // Abort the transaction on error
    await session.abortTransaction();
    throw new Error(`Failed to delete user: ${error.message}`);
  } finally {
    // Always end the session
    session.endSession();
  }
};

const selfDestruct = async (user_id: Types.ObjectId) => {
  const result = deleteSingleUser(user_id);
  return result;
};

const uploadOrChangeImg = async (
  user_id: Types.ObjectId,
  imgFile: Express.Multer.File,
) => {
  if (!user_id || !imgFile) {
    throw new Error('User ID and image file are required.');
  }

  // Upload new image to Cloudinary
  const result = await uploadImgToCloudinary(imgFile.filename, imgFile.path);

  console.log(result);

  if (!result.secure_url) {
    throw new Error('Image upload failed.');
  }

  // Update user profile with new image URL
  const updatedUserProfile = await ProfileModel.findOneAndUpdate(
    { user_id }, // Corrected query (find by user_id, not _id)
    { img: result.secure_url },
    { new: true },
  );

  if (!updatedUserProfile) {
    throw new Error('Profile not found or update failed.');
  }

  return updatedUserProfile;
};

const getProfile = async (user_id: Types.ObjectId) => {
  const profile = await ProfileModel.findOne({ user_id }).populate([
    { path: 'user_id', model: 'UserCollection' },
  ]);

  if (!profile) {
    throw new Error('Profile not found for the given user_id');
  }

  return profile;
};

const getSettingProfile = async (user_id: Types.ObjectId) => {
  const profile = await ProfileModel.findOne({ user_id });

  if (!profile) {
    throw new Error('Profile not found for the given user_id');
  }

  const groupList = await GroupTransactionModel.find({
    $or: [
      { ownerId: user_id },
      { groupMembers: profile.email }
    ]
  });

  const modifiedProfile: any = profile.toObject();
  modifiedProfile.friendsCount = profile.friends ? profile.friends.length : 0;
  modifiedProfile.groupList = groupList || [];

  return modifiedProfile;
};

// In userServices.ts
const updateUserByAdmin = async (
  userId: Types.ObjectId,
  payload: Partial<TUser>,
) => {

  if (payload.isBlocked === true) {
    payload.isLoggedIn = false;
  }

  const updatedUser = await UserModel.findByIdAndUpdate(userId, payload, {
    new: true,
    runValidators: true,
  });

  if (!updatedUser) {
    throw new Error('User not found or update failed');
  }

  return updatedUser;
};

const getUserFullDetails = async (userId: Types.ObjectId) => {
  const user = await UserModel.findById(userId).select('-password');
  const profile = await ProfileModel.findOne({ user_id: userId });

  return {
    user,
    profile,
  };
};

const blockUser = async (userId: string) => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  user.isBlocked = true;
  user.isLoggedIn = false;
  user.loggedOutTime = new Date();
  await user.save();
  return user;
};

const unblockUser = async (userId: string) => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  user.isBlocked = false;
  await user.save();

  return user;
};

// Friend Management Services
const addFriend = async (userId: Types.ObjectId, friendData: Partial<TFriend>) => {
  const profile = await ProfileModel.findOne({ user_id: userId });
  if (!profile) {
    throw new Error('Profile not found');
  }

  // Check if friend already exists
  const existingFriend = profile.friends?.find(f => f.email === friendData.email);
  if (existingFriend) {
    throw new Error('Friend already exists');
  }

  // Check if friend is an app user
  const appUser = await UserModel.findOne({ email: friendData.email });
  const newFriend: Partial<TFriend> = {
    ...friendData,
    isAppUser: !!appUser,
    user_id: appUser?._id,
    status: 'accepted'
  };

  await ProfileModel.findByIdAndUpdate(profile._id, {
    $push: { friends: newFriend }
  });

  return { message: 'Friend added successfully', friend: newFriend };
};

// Add Multiple Friends Service
const addMultipleFriends = async (userId: Types.ObjectId, friendsData: Partial<TFriend>[]) => {
  const profile = await ProfileModel.findOne({ user_id: userId });
  if (!profile) {
    throw new Error('Profile not found');
  }

  const results: {
    success: Array<{ email: string; name: string; isAppUser: boolean }>;
    failed: Array<{ email: string; name: string; reason: string }>;
    alreadyExists: Array<{ email: string; name: string; reason: string }>;
  } = {
    success: [],
    failed: [],
    alreadyExists: []
  };

  for (const friendData of friendsData) {
    try {
      const friend = friendData as any; // Allow flexible field names

      if (!friend.email) {
        results.failed.push({
          email: friend.email || 'unknown',
          name: friend.name || friend.username || 'unknown',
          reason: 'Email is required'
        });
        continue;
      }

      // Use name, username, or email as display name
      const displayName = friend.name || friend.username || friend.email.split('@')[0];

      // Check if friend already exists
      const existingFriend = profile.friends?.find(f => f.email === friend.email);
      if (existingFriend) {
        results.alreadyExists.push({
          email: friend.email,
          name: displayName,
          reason: 'Friend already exists'
        });
        continue;
      }

      // Check if friend is an app user
      const appUser = await UserModel.findOne({ email: friend.email });
      const newFriend: Partial<TFriend> = {
        name: displayName, // Ensure name is set
        email: friend.email,
        nickname: friend.nickname,
        tags: friend.tags,
        phone: friend.phone,
        profileImage: friend.profileImage,
        notes: friend.notes,
        socialLinks: friend.socialLinks,
        isAppUser: !!appUser,
        user_id: appUser?._id,
        status: 'accepted'
      };

      // Add friend to profile
      await ProfileModel.findByIdAndUpdate(profile._id, {
        $push: { friends: newFriend }
      });

      results.success.push({
        email: friend.email,
        name: displayName,
        isAppUser: !!appUser
      });

    } catch (error: any) {
      const friend = friendData as any;
      results.failed.push({
        email: friend.email || 'unknown',
        name: friend.name || friend.username || 'unknown',
        reason: error.message || 'Unknown error'
      });
    }
  }

  return {
    message: `Added ${results.success.length} friends successfully`,
    summary: {
      total: friendsData.length,
      successful: results.success.length,
      failed: results.failed.length,
      alreadyExists: results.alreadyExists.length
    },
    details: results
  };
};

const getFriends = async (userId: Types.ObjectId) => {
  const profile = await ProfileModel.findOne({ user_id: userId })
    .populate('friends.user_id', 'name email img')
    .lean();

  if (!profile) {
    throw new Error('Profile not found');
  }

  return profile.friends || [];
};

const deleteFriend = async (userId: Types.ObjectId, friendEmail: string) => {

  const isGroupMember = await GroupTransactionModel.findOne({
    $or: [
      { ownerEmail: friendEmail },
      { groupMembers: { $in: [friendEmail] } }
    ]
  });

  if (isGroupMember) {
    throw new Error('You can’t delete them yet. To delete them, they must be removed from your group, or you can delete the entire group.');
    
  } else {
    const profile = await ProfileModel.findOne({ user_id: userId });
    if (!profile) {
      throw new Error('Profile not found');
    }

    const friendIndex = profile.friends?.findIndex(f => f.email === friendEmail);
    if (friendIndex === -1 || friendIndex === undefined) {
      throw new Error('Friend not found');
    }

    await ProfileModel.findByIdAndUpdate(profile._id, {
      $pull: { friends: { email: friendEmail } }
    });

    return { message: 'Friend deleted successfully' };
  }

};

const updateFriend = async (userId: Types.ObjectId, friendEmail: string, updateData: Partial<TFriend>) => {
  const profile = await ProfileModel.findOne({ user_id: userId });
  if (!profile) {
    throw new Error('Profile not found');
  }

  const friendIndex = profile.friends?.findIndex(f => f.email === friendEmail);
  if (friendIndex === -1 || friendIndex === undefined) {
    throw new Error('Friend not found');
  }

  // Update specific friend fields
  const updateFields: any = {};
  Object.keys(updateData).forEach(key => {
    if (updateData[key as keyof TFriend] !== undefined) {
      updateFields[`friends.${friendIndex}.${key}`] = updateData[key as keyof TFriend];
    }
  });

  await ProfileModel.findByIdAndUpdate(profile._id, {
    $set: updateFields
  });

  return { message: 'Friend updated successfully' };
};

// Category Management Services
const createCategoryPersonal = async (userId: Types.ObjectId, categoryData: TCategory) => {
  try {
    const isExist = await CategoryModel.findOne({ name: categoryData.name, user_id: userId, type: 'personal' });
    if (isExist) {
      throw new Error('Category already exists');
    }
    const newCategory = new CategoryModel({ ...categoryData, user_id: userId, type: 'personal' });
    await newCategory.save();
    return { message: 'Personal category created successfully', category: newCategory };
  } catch (error) {
    throw new Error('Error creating personal category: ' + (error as any).message);
  }
};

const createCategoryGroup = async (userId: Types.ObjectId, categoryData: TCategory) => {
  try {
    const isExist = await CategoryModel.findOne({ name: categoryData.name, user_id: userId, type: 'group' });
    if (isExist) {
      throw new Error('Category already exists');
    }
    const newCategory = new CategoryModel({ ...categoryData, user_id: userId, type: 'group' });
    await newCategory.save();
    return { message: 'Group category created successfully', category: newCategory };
  } catch (error) {
    throw new Error('Error creating group category: ' + (error as any).message);
  }
};

const getAllCategories = async (userId: Types.ObjectId) => {
  try {
    const categories = await CategoryModel.find({ user_id: userId });
    return categories;
  } catch (error) {
    throw new Error('Error retrieving categories: ' + (error as any).message);
  }
};

const getAllCategoriesForPersonal = async (userId: Types.ObjectId) => {
  try {
    const categories = await CategoryModel.find({ user_id: userId, type: 'personal' });
    return categories;
  } catch (error) {
    throw new Error('Error retrieving personal categories: ' + (error as any).message);
  }
};

const getAllCategoriesForGroup = async (userId: Types.ObjectId) => {
  try {
    const categories = await CategoryModel.find({ user_id: userId, type: 'group' });
    return categories;
  } catch (error) {
    throw new Error('Error retrieving group categories: ' + (error as any).message);
  }
};

const deleteCategory = async (userId: Types.ObjectId, categoryId: Types.ObjectId) => {
  try {
    const result = await CategoryModel.findOneAndDelete({ _id: categoryId, user_id: userId });
    if (!result) {
      throw new Error('Category not found');
    }
    return { message: 'Category deleted successfully' };
  } catch (error) {
    throw new Error('Error deleting category: ' + (error as any).message);
  }
};

const updateCategory = async (userId: Types.ObjectId, categoryId: Types.ObjectId, updateData: Partial<TCategory>) => {
  try {
    // Check if category exists and belongs to the user
    const existingCategory = await CategoryModel.findOne({ _id: categoryId, user_id: userId });
    if (!existingCategory) {
      throw new Error('Category not found or you do not have permission to update it');
    }

    // If name is being updated, check for duplicates
    if (updateData.name && updateData.name !== existingCategory.name) {
      const duplicateCategory = await CategoryModel.findOne({
        name: updateData.name,
        user_id: userId,
        type: updateData.type || existingCategory.type,
        _id: { $ne: categoryId } // Exclude current category
      });
      if (duplicateCategory) {
        throw new Error('A category with this name already exists');
      }
    }

    const updatedCategory = await CategoryModel.findOneAndUpdate(
      { _id: categoryId, user_id: userId },
      { $set: updateData },
      { new: true }
    );

    if (!updatedCategory) {
      throw new Error('Failed to update category');
    }

    return { message: 'Category updated successfully', category: updatedCategory };
  } catch (error) {
    throw new Error('Error updating category: ' + (error as any).message);
  }
};

const userServices = {
  createUser,
  getAllUsers,
  updateProfileData,
  deleteSingleUser,
  selfDestruct,
  uploadOrChangeImg,
  getProfile,
  getSettingProfile,
  updateUserProfile,
  getAllProfiles,
  updateUserByAdmin,
  getUserFullDetails,
  setFCMToken,
  blockUser,
  unblockUser,
  // Friend management services
  addFriend,
  addMultipleFriends,
  getFriends,
  deleteFriend,
  updateFriend,

  // Category Management Services
  createCategoryPersonal,
  createCategoryGroup,
  getAllCategories,
  getAllCategoriesForPersonal,
  getAllCategoriesForGroup,
  deleteCategory,
  updateCategory
};

export default userServices;

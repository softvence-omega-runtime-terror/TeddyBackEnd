import { Types } from 'mongoose';
import catchAsync from '../../util/catchAsync';
import globalResponseHandler from '../../util/globalResponseHandler';
import idConverter from '../../util/idConverter';
import userServices from './user.service';
import { sendEmail } from '../../util/sendEmail';

// Friend Management Controllers
const addFriend = catchAsync(async (req, res) => {
  const user_id = req.user.id;
  const requestBody = req.body;

  // Check if it's a single friend or multiple friends
  const isMultiple = Array.isArray(requestBody.friends) || Array.isArray(requestBody);

  let result;
  let emailsToSend: string[] = [];

  if (isMultiple) {
    // Handle multiple friends
    const friendsData = Array.isArray(requestBody) ? requestBody : requestBody.friends;
    result = await userServices.addMultipleFriends(user_id, friendsData);

    // Collect emails of successfully added friends
    emailsToSend = result.details.success.map((friend: any) => friend.email);
  } else {
    // Handle single friend
    const friendData = requestBody;
    result = await userServices.addFriend(user_id, friendData);

    if (result && friendData.email) {
      emailsToSend = [friendData.email];
    }
  }

  // Send emails to successfully added friends
  if (emailsToSend.length > 0) {
    // Get user's profile to get their name for the email
    const senderProfile = await userServices.getProfile(user_id);
    const senderName = senderProfile?.name || 'Someone';

    const emailHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Friend Request</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 300;
          }
          .content {
            padding: 40px 30px;
          }
          .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #2c3e50;
          }
          .message {
            font-size: 16px;
            margin-bottom: 30px;
            line-height: 1.8;
          }
          .friend-info {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
            margin: 20px 0;
          }
          .friend-name {
            font-size: 20px;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 5px;
          }
          .friend-email {
            color: #7f8c8d;
            font-size: 14px;
          }
          .cta-section {
            text-align: center;
            margin: 30px 0;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 25px;
            font-weight: 600;
            font-size: 16px;
            transition: transform 0.2s ease;
          }
          .cta-button:hover {
            transform: translateY(-2px);
          }
          .footer {
            background-color: #2c3e50;
            color: #ecf0f1;
            padding: 20px;
            text-align: center;
            font-size: 14px;
          }
          .footer a {
            color: #3498db;
            text-decoration: none;
          }
          .icon {
            font-size: 48px;
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="icon">👥</div>
            <h1>New Friend Request!</h1>
          </div>
          
          <div class="content">
            <div class="greeting">Hello there! 👋</div>
            
            <div class="message">
              You've received a new friend request! Someone would like to connect with you.
            </div>
            
            <div class="friend-info">
              <div class="friend-name">${senderName}</div>
              <div class="friend-email">${req.user.email || 'via App'}</div>
            </div>
            
            <div class="message">
              ${senderName} would like to add you as a friend. You can connect to share expenses, 
              split bills, and keep track of your shared financial activities together.
            </div>
            
            <div class="cta-section">
              <a href="#" class="cta-button">
                🚀 Open App to Respond
              </a>
            </div>
            
            <div class="message" style="font-size: 14px; color: #7f8c8d; text-align: center;">
              This friend request was sent through our expense tracking app. 
              If you don't have the app yet, download it to manage your finances together!
            </div>
          </div>
          
          <div class="footer">
            <p>Best regards,<br>The Expense Tracker Team</p>
            <p>
              <a href="#">Download App</a> | 
              <a href="#">Support</a> | 
              <a href="#">Privacy Policy</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send emails to all successfully added friends
    const emailPromises = emailsToSend.map(email =>
      sendEmail(
        email,
        '👥 New Friend Request - Join & Split Expenses Together!',
        emailHTML
      )
    );

    try {
      await Promise.all(emailPromises);
    } catch (emailError) {
      console.error('Failed to send some friend request emails:', emailError);
      // Don't fail the entire request if emails fail
    }
  }

  globalResponseHandler(res, {
    statusCode: 200,
    success: true,
    message: result.message,
    data: isMultiple ? result : (result as any).friend,
  });
});

const getFriends = catchAsync(async (req, res) => {
  const user_id = req.user.id;

  const result = await userServices.getFriends(user_id);

  globalResponseHandler(res, {
    statusCode: 200,
    success: true,
    message: 'Friends retrieved successfully',
    data: result,
  });
});

const deleteFriend = catchAsync(async (req, res) => {
  const user_id = req.user.id;
  const { friendEmail } = req.params;

  const result = await userServices.deleteFriend(user_id, friendEmail);

  globalResponseHandler(res, {
    statusCode: 200,
    success: true,
    message: result.message,
    data: null,
  });
});

const updateFriend = catchAsync(async (req, res) => {
  const user_id = req.user.id;
  const { friendEmail } = req.params;
  const updateData = req.body;

  const result = await userServices.updateFriend(user_id, friendEmail, updateData);

  globalResponseHandler(res, {
    statusCode: 200,
    success: true,
    message: result.message,
    data: null,
  });
});

const createUser = catchAsync(async (req, res): Promise<void> => {
  try {
    const result = await userServices.createUser(req.body);

    res.status(200).json({
      status: 'success',
      message: 'User created successfully',
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to create user',
      error: (error as Error).message,
    });
  }
});

const setFCMToken = catchAsync(async (req, res) => {
  const user_id = req.user.id; // Assuming req.user.id is already an ObjectId from your auth middleware
  const fcmToken = req.body.fcmToken;

  if (!fcmToken) {
    throw new Error('fcm token is required');
  }

  const result = await userServices.setFCMToken(user_id, fcmToken);

  globalResponseHandler(res, {
    statusCode: 200,
    success: true,
    message: 'FCM token set successfully',
    data: result,
  });
});

const getAllUsers = catchAsync(async (req, res) => {
  const result = await userServices.getAllUsers();
  globalResponseHandler(res, {
    statusCode: 200,
    success: true,
    message: 'All users',
    data: result,
  });
});

const getAllProfiles = catchAsync(async (req, res) => {
  // Call the user service method to get all profiles
  const result = await userServices.getAllProfiles();

  globalResponseHandler(res, {
    statusCode: 200,
    success: true,
    message: 'All profiles retrieved successfully',
    data: result,
  });
});

// update profile controller
const updateUserProfile = catchAsync(async (req, res) => {
  const user_id = req.user.id; // Assuming req.user.id is already an ObjectId from your auth middleware

  // No need to convert to ObjectId since it's already an ObjectId
  // Parse JSON data from 'data' field in form-data
  const profileData = JSON.parse(req.body.data);
  const imgFile = req.file; // Image file (if uploaded)

  // Call the service to update the profile, passing the imgFile (optional)
  const updatedProfile = await userServices.updateUserProfile(
    user_id,
    profileData,
    imgFile,
  );

  // Send the response with the updated profile data
  globalResponseHandler(res, {
    statusCode: 200,
    success: true,
    message: 'Profile updated successfully',
    data: updatedProfile,
  });
});

const updateProfileData = catchAsync(async (req, res) => {
  const user_id =
    typeof req.user.id === 'string' ? idConverter(req.user.id) : req.user.id;
  const payload = req.body;
  const result = await userServices.updateProfileData(user_id, payload);
  globalResponseHandler(res, {
    statusCode: 200,
    success: true,
    message: 'profile updated',
    data: result,
  });
});

const deleteSingleUser = catchAsync(async (req, res) => {
  const user_id = req.query.user_id as string;
  const userIdConverted = idConverter(user_id);
  console.log(user_id, userIdConverted);
  if (!userIdConverted) {
    throw new Error('user id conversion failed');
  }
  const result = await userServices.deleteSingleUser(userIdConverted);
  globalResponseHandler(res, {
    statusCode: 200,
    success: true,
    message: 'user deleted',
    data: result,
  });
});

const selfDestruct = catchAsync(async (req, res) => {
  const user_id = req.user.id;
  const userIdConverted = idConverter(user_id);
  if (!userIdConverted) {
    throw new Error('user id conversion failed');
  }

  const result = await userServices.selfDestruct(userIdConverted);

  globalResponseHandler(res, {
    statusCode: 200,
    success: true,
    message: 'your account deletion successful',
    data: result,
  });
});

const uploadOrChangeImg = catchAsync(async (req, res) => {
  const actionType = req.query.actionType as string; // Fixed typo in `actionType`
  const user_id = req.user.id;
  const imgFile = req.file;

  if (!user_id || !imgFile) {
    throw new Error('User ID and image file are required.');
  }

  // Ensure `idConverter` returns only the ObjectId
  const userIdConverted = idConverter(user_id);
  if (!(userIdConverted instanceof Types.ObjectId)) {
    throw new Error('User ID conversion failed');
  }

  // Call the service function to handle the upload
  const result = await userServices.uploadOrChangeImg(
    userIdConverted,
    imgFile as Express.Multer.File,
  );

  // Send response
  globalResponseHandler(res, {
    statusCode: 200,
    success: true,
    message: `Your profile picture has been ${actionType || 'updated'}`,
    data: result,
  });
});

const getProfile = catchAsync(async (req, res) => {
  const user_id = req.user.id;
  const converted_user_id = idConverter(user_id);
  if (!converted_user_id) {
    throw Error('id conversation failed');
  }
  const result = await userServices.getProfile(converted_user_id);

  globalResponseHandler(res, {
    statusCode: 200,
    success: true,
    message: 'your position retrieved successfully',
    data: result,
  });
});

const getSettingProfile = catchAsync(async (req, res) => {
  const user_id = req.user.id;
  const converted_user_id = idConverter(user_id);
  if (!converted_user_id) {
    throw Error('id conversation failed');
  }
  const result = await userServices.getSettingProfile(converted_user_id);

  globalResponseHandler(res, {
    statusCode: 200,
    success: true,
    message: 'your position retrieved successfully',
    data: result,
  });
});

const updateUserByAdmin = catchAsync(async (req, res) => {
  const user_id = req.params.id;
  const convertedUserId = idConverter(user_id);

  if (!convertedUserId) {
    throw new Error('User ID conversion failed');
  }

  const payload = req.body;

  const result = await userServices.updateUserByAdmin(convertedUserId, payload);

  globalResponseHandler(res, {
    statusCode: 200,
    success: true,
    message: 'User updated successfully',
    data: result,
  });
});

const getUserFullDetails = catchAsync(async (req, res) => {
  const userId = req.params.id;
  const convertedUserId = idConverter(userId);

  if (!convertedUserId) {
    throw new Error('Invalid user ID.');
  }

  const result = await userServices.getUserFullDetails(convertedUserId);

  globalResponseHandler(res, {
    statusCode: 200,
    success: true,
    message: 'User full details retrieved successfully',
    data: result,
  });
});

const blockUserController = catchAsync(async (req, res) => {
  const userId = req.params.id;

  const result = await userServices.blockUser(userId);

  globalResponseHandler(res, {
    statusCode: 200,
    success: true,
    message: 'User blocked successfully',
    data: result,
  });
});

const unblockUserController = catchAsync(async (req, res) => {
  const userId = req.params.id;

  const result = await userServices.unblockUser(userId);

  globalResponseHandler(res, {
    statusCode: 200,
    success: true,
    message: 'User unblocked successfully',
    data: result,
  });
});


// Category Management

const debugCategories = catchAsync(async (req, res) => {
  const user_id = req.user.id;
  const converted_user_id = idConverter(user_id);
  if (!converted_user_id) {
    throw Error('id conversation failed');
  }

  console.log('=== DEBUG: Category Debug Info ===');
  console.log('User ID from token:', user_id);
  console.log('Converted User ID:', converted_user_id);

  // Check categories count
  const hasCategories = await userServices.checkUserHasCategories(converted_user_id);
  const allCategories = await userServices.getAllCategories(converted_user_id);

  globalResponseHandler(res, {
    statusCode: 200,
    success: true,
    message: 'Debug information retrieved',
    data: {
      userId: converted_user_id,
      hasCategories,
      categoryCount: allCategories.length,
      categories: allCategories,
    },
  });
});

const initializeDefaultCategories = catchAsync(async (req, res) => {
  const user_id = req.user.id;
  const converted_user_id = idConverter(user_id);
  if (!converted_user_id) {
    throw Error('id conversation failed');
  }

  // Check if user already has categories
  const hasCategories = await userServices.checkUserHasCategories(converted_user_id);
  if (hasCategories) {
    globalResponseHandler(res, {
      statusCode: 200,
      success: true,
      message: 'User already has categories. Default categories not created.',
      data: null,
    });
    return;
  }

  const result = await userServices.createDefaultCategories(converted_user_id);

  globalResponseHandler(res, {
    statusCode: 201,
    success: true,
    message: 'Default categories initialized successfully',
    data: result,
  });
});

const createCategoryPersonal = catchAsync(async (req, res) => {
  const user_id = req.user.id;
  const converted_user_id = idConverter(user_id);
  if (!converted_user_id) {
    throw Error('id conversation failed');
  }
  const result = await userServices.createCategoryPersonal(converted_user_id, req.body);

  globalResponseHandler(res, {
    statusCode: 201,
    success: true,
    message: 'Category created successfully',
    data: result,
  });
});

const createIncomeCategoryPersonal = catchAsync(async (req, res) => {
  const user_id = req.user.id;
  const converted_user_id = idConverter(user_id);
  if (!converted_user_id) {
    throw Error('id conversation failed');
  }
  const result = await userServices.createIncomeCategoryPersonal(converted_user_id, req.body);

  globalResponseHandler(res, {
    statusCode: 201,
    success: true,
    message: 'Category created successfully',
    data: result,
  });
});

const createCategoryGroup = catchAsync(async (req, res) => {
  const user_id = req.user.id;
  const converted_user_id = idConverter(user_id);
  if (!converted_user_id) {
    throw Error('id conversation failed');
  }
  const result = await userServices.createCategoryGroup(converted_user_id, req.body);

  globalResponseHandler(res, {
    statusCode: 201,
    success: true,
    message: 'Category created successfully',
    data: result,
  });
});

const createIncomeCategoryGroup = catchAsync(async (req, res) => {
  const user_id = req.user.id;
  const converted_user_id = idConverter(user_id);
  if (!converted_user_id) {
    throw Error('id conversation failed');
  }
  const result = await userServices.createIncomeCategoryGroup(converted_user_id, req.body);

  globalResponseHandler(res, {
    statusCode: 201,
    success: true,
    message: 'Category created successfully',
    data: result,
  });
});


const getAllCategories = catchAsync(async (req, res) => {
  const user_id = req.user.id;
  const converted_user_id = idConverter(user_id);
  if (!converted_user_id) {
    throw Error('id conversation failed');
  }

  // Extract query parameters for filtering
  const { type, transactionType } = req.query;

  // Build filters object
  const filters: { type?: 'personal' | 'group'; transactionType?: 'income' | 'expense' } = {};

  if (type && (type === 'personal' || type === 'group')) {
    filters.type = type as 'personal' | 'group';
  }

  if (transactionType && (transactionType === 'income' || transactionType === 'expense')) {
    filters.transactionType = transactionType as 'income' | 'expense';
  }

  const result = await userServices.getAllCategories(converted_user_id, Object.keys(filters).length > 0 ? filters : undefined);

  globalResponseHandler(res, {
    statusCode: 200,
    success: true,
    message: 'Categories retrieved successfully',
    data: result,
  });
});

const getAllCategoriesForPersonal = catchAsync(async (req, res) => {
  const user_id = req.user.id;
  const converted_user_id = idConverter(user_id);
  if (!converted_user_id) {
    throw Error('id conversation failed');
  }
  const result = await userServices.getAllCategoriesForPersonal(converted_user_id);

  globalResponseHandler(res, {
    statusCode: 200,
    success: true,
    message: 'Categories retrieved successfully',
    data: result,
  });
});

const getAllCategoriesForGroup = catchAsync(async (req, res) => {
  const user_id = req.user.id;
  const converted_user_id = idConverter(user_id);
  if (!converted_user_id) {
    throw Error('id conversation failed');
  }
  const result = await userServices.getAllCategoriesForGroup(converted_user_id);

  globalResponseHandler(res, {
    statusCode: 200,
    success: true,
    message: 'Categories retrieved successfully',
    data: result,
  });
});

const deleteCategory = catchAsync(async (req, res) => {
  const user_id = req.user.id;
  const converted_user_id = idConverter(user_id);
  if (!converted_user_id) {
    throw Error('id conversation failed');
  }
  const category_id = req.params.id;
  const converted_category_id = idConverter(category_id);
  if (!converted_category_id) {
    throw Error('category id conversion failed');
  }
  const result = await userServices.deleteCategory(converted_user_id, converted_category_id);

  globalResponseHandler(res, {
    statusCode: 200,
    success: true,
    message: 'Category deleted successfully',
    data: result,
  });
});

const updateCategory = catchAsync(async (req, res) => {
  const user_id = req.user.id;
  const converted_user_id = idConverter(user_id);
  if (!converted_user_id) {
    throw Error('id conversation failed');
  }
  const category_id = req.params.id;
  const converted_category_id = idConverter(category_id);
  if (!converted_category_id) {
    throw Error('category id conversion failed');
  }
  const result = await userServices.updateCategory(converted_user_id, converted_category_id, req.body);

  globalResponseHandler(res, {
    statusCode: 200,
    success: true,
    message: 'Category updated successfully',
    data: result,
  });
});


const userController = {
  addFriend,
  getFriends,
  deleteFriend,
  debugCategories,
  initializeDefaultCategories,
  createCategoryPersonal,
  createCategoryGroup,
  createIncomeCategoryPersonal,
  createIncomeCategoryGroup,
  getAllCategories,
  getAllCategoriesForPersonal,
  getAllCategoriesForGroup,
  deleteCategory,
  updateCategory,
  updateFriend,
  createUser,
  getAllUsers,
  updateProfileData,
  deleteSingleUser,
  selfDestruct,
  uploadOrChangeImg,
  getProfile,
  updateUserProfile,
  getAllProfiles,
  updateUserByAdmin,
  getUserFullDetails,
  setFCMToken,
  blockUserController,
  unblockUserController,
  getSettingProfile
};

export default userController;

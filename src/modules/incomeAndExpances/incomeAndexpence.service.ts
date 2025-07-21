import { Types } from "mongoose"
import { uploadImgToCloudinary } from "../../util/uploadImgToCloudinary";
import { IncomeTypesModel } from "./incomeAndexpence.model";



interface IncomeTypeSubdocument {
  img?: string | null;
  name: string;
}

interface IncomeTypesDocument extends Document {
  user_id?: Types.ObjectId | null;
  incomeTypeList: Types.DocumentArray<IncomeTypeSubdocument>;
}

const createIncomeType = async (payload: any, user_id: Types.ObjectId | null = null, file: any) => {
  try {
    console.log("Payload for creating income type:", { user_id, payload });

    // Validate payload
    const { name } = payload;
    if (!name) {
      throw new Error("Income type name is required");
    }

    // Handle single file upload to Cloudinary
    let imageUrl: string | null = null;
    if (file) {
      const imageName = `${Math.floor(100 + Math.random() * 900)}-${Date.now()}`;
      const uploadResult = await uploadImgToCloudinary(imageName, file.path);
      imageUrl = uploadResult.secure_url;
    }

    // Prepare new income type object
    const newIncomeType: IncomeTypeSubdocument = {
      img: imageUrl,
      name,
    };

    // Query condition: user_id for specific users, null for common types
    const query = user_id ? { user_id } : { user_id: null };

    // Check if a document exists
    const existingIncomeTypes = await IncomeTypesModel.findOne<IncomeTypesDocument>(query);

    if (existingIncomeTypes) {
      // Initialize incomeTypeList if null or undefined
      if (!existingIncomeTypes.incomeTypeList) {
        await IncomeTypesModel.updateOne(
          query,
          { $set: { incomeTypeList: [] } },
          { upsert: true }
        );
      }

      // Check for duplicate name
      const isDuplicate = existingIncomeTypes.incomeTypeList.some(
        (incomeType) => incomeType.name === payload.name
      );

      if (isDuplicate) {
        throw new Error(`Income type '${payload.name}' already exists`);
      }

      // Update existing document by pushing new income type
      await IncomeTypesModel.updateOne(
        query,
        { $push: { incomeTypeList: newIncomeType } }
      );

      // Fetch updated document
      const updatedIncomeTypes = await IncomeTypesModel.findOne<IncomeTypesDocument>(query);
      return updatedIncomeTypes;
    } else {
      // Create new document
      const newIncomeTypes = await IncomeTypesModel.create({
        user_id,
        incomeTypeList: [newIncomeType],
      });
      return newIncomeTypes;
    }
  } catch (error: any) {
    console.error("Error in createIncomeType service:", error.message);
    throw new Error(`Failed to create income type: ${error.message}`);
  }
};



const createExpensesType = async(user_id:Types.ObjectId, payload:any)=>{
console.log("here is the payload Expences type", user_id, payload)
}


const addIncome = async(user_id:Types.ObjectId, payload:any)=>{
console.log("here is the payload ", user_id, payload)
}

const incomeAndExpensesService ={
addIncome,createIncomeType,createExpensesType
}

export default incomeAndExpensesService
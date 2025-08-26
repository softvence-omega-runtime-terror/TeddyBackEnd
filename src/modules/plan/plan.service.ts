import { stripe } from "../../config";
import idConverter from "../../util/idConverter";
import { TPlan } from "./plan.interface";
import { PlanModel } from "./plan.model";

const createPlan = async (data: Partial<TPlan>) => {
    try {

        const findPlan = await PlanModel.findOne({ name: data.name, price: data.price });
        
        if (findPlan) {
            throw new Error("Plan with the same name and price already exists");
        };

        // Validate billingInterval if subscription
        if (data.subscription && !data.billingInterval) {
            throw new Error("Billing interval is required for subscription plans");
        }

        // 1. Create Stripe Product
        const product = await stripe.products.create({
            name: data.name ?? "Unnamed Plan",
            description: data.description || undefined,
            metadata: {
                planName: data.name ?? null,
            },
        });

        // 2. Prepare price creation params
        const priceParams: any = {
            unit_amount: Math.round((data.price || 0) * 100), // convert to cents
            currency: "usd",
            product: product.id,
        };

        // If subscription, add recurring interval
        if (data.subscription && data.billingInterval) {
            priceParams.recurring = { interval: data.billingInterval };
        }

        // 3. Create Stripe Price
        const price = await stripe.prices.create(priceParams);

        // 4. Save Plan with stripePriceId
        const planData = {
            ...data,
            stripePriceId: price.id,
        };

        const plan = await PlanModel.create(planData);

        return plan;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(error.message || "An error occurred while creating the plan");
        } else {
            throw new Error("An error occurred while creating the plan");
        }
    }
};

const updatePlan = async (id: string, data: Partial<TPlan>) => {
    try {
        const idConvert = idConverter(id);
        const isExist = await PlanModel.findById(idConvert);
        if (!isExist) {
            throw new Error("Plan does not exist");
        }

        if (data.subscription && !data.billingInterval) {
            throw new Error("Billing interval is required for subscription plans");
        }

        const plan = await PlanModel.findByIdAndUpdate(idConvert, data, { new: false });
        return plan;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(error.message || "An error occurred while updating the plan");
        } else {
            throw new Error("An error occurred while updating the plan");
        }
    }
}

const getPlanById = async (id: string) => {
    try {
        const idConvert = idConverter(id);
        const isExist = await PlanModel.findById(idConvert);
        if (!isExist) {
            throw new Error("Plan does not exist");
        }

        const plan = await PlanModel.findById(idConvert);
        return plan;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(error.message || "An error occurred while retrieving the plan");
        } else {
            throw new Error("An error occurred while retrieving the plan");
        }
    }
}

const getPlans = async () => {
    try {
        const plans = await PlanModel.find();
        return plans;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(error.message || "An error occurred while retrieving the plans");
        } else {
            throw new Error("An error occurred while retrieving the plans");
        }
    }
}

const deletePlan = async (id: string) => {
    try {
        const idConvert = idConverter(id);
        const isExist = await PlanModel.findById(idConvert);
        if (!isExist) {
            throw new Error("Plan does not exist");
        }

        const plan = await PlanModel.findByIdAndDelete(idConvert);
        return plan;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(error.message || "An error occurred while deleting the plan");
        } else {
            throw new Error("An error occurred while deleting the plan");
        }
    }
}


const planServices = {
    createPlan,
    updatePlan,
    getPlanById,
    getPlans,
    deletePlan
};
export default planServices;

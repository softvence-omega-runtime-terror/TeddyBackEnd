import catchAsync from "../../util/catchAsync";
import planServices from "./plan.service";

const createPlan = catchAsync(async (req, res) => {
    const adminId = req.user?.id;

    if (!adminId) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: Admin ID missing"
        });
    }

    const data = req.body;
    const result = await planServices.createPlan(data);

    res.status(201).json({
        success: true,
        message: "Plan created successfully",
        data: { plan: result }
    });
});

const updatePlan = catchAsync(async (req, res) => {
    const { id } = req.params;
    const data = req.body;

    const result = await planServices.updatePlan(id, data);
    res.status(200).json({
        success: true,
        message: "Plan updated successfully",
        data: {
            plan: result
        }
    });
})

const getPlanById = catchAsync(async (req, res) => {
    const { id } = req.params;

    const result = await planServices.getPlanById(id);
    res.status(200).json({
        success: true,
        message: "plan retrieved successfully",
        data: {
            plan: result
        }
    });
})

const getPlans = catchAsync(async (req, res) => {
    const result = await planServices.getPlans();
    res.status(200).json({
        success: true,
        message: "Plans retrieved successfully",
        data: {
            plans: result
        }
    });
})

const deletePlan = catchAsync(async (req, res) => {
    const { id } = req.params;

    const result = await planServices.deletePlan(id);
    res.status(200).json({
        success: true,
        message: "Plan deleted successfully",
        data: {
            plan: result
        }
    });
})


const planController = {
    createPlan,
    updatePlan,
    getPlanById,
    getPlans,
    deletePlan
};

export default planController;
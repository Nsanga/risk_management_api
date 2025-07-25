const TenatService = require("../services/tenant.service");

async function createTenant(req, res) {
    return await TenatService.createTenant(req, res);
}

async function getAllTenants(req, res) {
    return await TenatService.getAllTenants(req, res);
}

async function getTenantById(req, res) {
    return await TenatService.getTenantById(req, res);
}

async function updateTenant(req, res) {
    return await TenatService.updateTenant(req, res);
}

async function deleteTenant(req, res) {
    return await TenatService.deleteTenant(req, res);
}

module.exports = {
    createTenant,
    getAllTenants,
    getTenantById,
    updateTenant,
    deleteTenant
};

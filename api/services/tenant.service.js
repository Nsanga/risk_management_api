const Tenant = require("../models/tenant.model");
const { uploadToCloudinary } = require("./uploadFile.service");
const ResponseService = require('./response.service');

exports.createTenant = async (req, res) => {
    try {
        const { name, tenantId, primaryColor } = req.body;
        let logo = null;

        if (req.file) {
            logo = await uploadToCloudinary(req.file.path, "tenants/logos");
        }

        const exists = await Tenant.findOne({ tenantId });
        if (exists) {
            return res.status(400).json({ message: "Tenant ID déjà utilisé" });
        }

        const newTenant = new Tenant({
            name,
            tenantId,
            primaryColor,
            logo,
            features: {},
            sidebarMenus: {},
        });
        await newTenant.save();

        return res.status(201).json({ message: "Tenant créé", tenant: newTenant });
    } catch (err) {
        console.error("Erreur création tenant:", err);
        return res.status(500).json({ error: err.message });
    }
};

exports.getAllTenants = async (req, res) => {
    try {
        const tenants = await Tenant.find();
        return ResponseService.success(res, { tenants });
    } catch (error) {
        console.error('Erreur lors de la récupération des tenants:', error);
        return ResponseService.internalServerError(res, { error: error.message });
    }
};

exports.getTenantById = async (req, res) => {
    try {
        const { id } = req.params;
        const tenant = await Tenant.findById(id);
        if (!tenant) {
            return res.status(404).json({ message: "Tenant non trouvé" });
        }
        return res.status(200).json({ tenant });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

exports.updateTenant = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, tenantId, primaryColor, features, sidebarMenus } = req.body;
        let logo;

        if (req.file) {
            logo = await uploadToCloudinary(req.file.path, "tenants/logos");
        }

        const tenant = await Tenant.findById(id);
        if (!tenant) {
            return res.status(404).json({ message: "Tenant non trouvé" });
        }

        tenant.name = name || tenant.name;
        tenant.tenantId = tenantId || tenant.tenantId;
        tenant.primaryColor = primaryColor || tenant.primaryColor;
        tenant.features = features ? JSON.parse(features) : tenant.features;
        tenant.sidebarMenus = sidebarMenus ? JSON.parse(sidebarMenus) : tenant.sidebarMenus;
        if (logo) tenant.logo = logo;

        await tenant.save();
        return res.status(200).json({ message: "Tenant mis à jour", tenant });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

exports.deleteTenant = async (req, res) => {
    try {
        const { id } = req.params;
        const tenant = await Tenant.findByIdAndDelete(id);
        if (!tenant) {
            return res.status(404).json({ message: "Tenant non trouvé" });
        }
        return res.status(200).json({ message: "Tenant supprimé" });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
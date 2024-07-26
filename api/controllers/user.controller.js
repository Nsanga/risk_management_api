const userService = require('../services/user.service');
const ResponseService = require('../services/response.service');

const getAllUser = async (req, res) => {
  const role = req.query.role;
  const response = await userService.list(role)
  if (response.success) {
    return ResponseService.success(res, { users: response.users,total:response.total });
  } else {
    return ResponseService.internalServerError(res, { error: response.error });
  }
};

const updateUser = async (req, res) => {
  const {...updatedData} = req.body;
  const email = req.query.email;
  const response = await userService.update(email, updatedData);

  if (response.success) {
    return ResponseService.success(res, { users: response.user });
  } else {
    return ResponseService.notFound(res, { message: response.error });
  }
}

const login = async (req, res) => {
  const { email, password } = req.body;
  const response = await userService.login(email, password);
  if (response.success) {
    return ResponseService.success(res, { token: response.token , user:response.user });
  } else {
    return ResponseService.unauthorized(res, { error: response.error });
  }
};

const signUp = async (req, res) => {
    const { fullname, email, role } = req.body;
    const response = await userService.save(fullname, email, role);

    if (response.success) {
        return ResponseService.success(res, { user: response.data, message: response.message });
    } else if (response.exist) {
        return ResponseService.success(res, { user: response.data, message: response.message });
    } else {
        return ResponseService.internalServerError(res, { error: response.error });
    }
};

module.exports = {
  getAllUser,
  login,
  signUp,
  updateUser
};
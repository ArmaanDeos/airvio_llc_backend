export class ApiResponse {
  constructor(statusCode, message, data = null, success = true) {
    this.status = success ? "success" : "error";
    this.statusCode = statusCode;
    this.message = message;
    if (data) this.data = data;
  }
}

export const successResponse = (res, message, data, code = 200) => {
  return res.status(code).json(new ApiResponse(code, message, data, true));
};

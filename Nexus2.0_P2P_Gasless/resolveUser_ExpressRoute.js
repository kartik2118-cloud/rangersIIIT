/**
 * resolveUser.js — Express route
 *
 * Thin Express wrapper around the mock Lambda handler.
 * Mounts at: GET /api/resolve-user?username=@arya_chougule
 *
 * Mirrors how API Gateway invokes the Lambda with a proxy event.
 */

const express        = require("express");
const { handler }    = require("../lambda/resolveUser");

const router = express.Router();

router.get("/", async (req, res) => {
  // Shape the request into a Lambda-style API Gateway proxy event
  const event = {
    httpMethod:            "GET",
    queryStringParameters: { username: req.query.username ?? "" },
  };

  const lambdaResponse = await handler(event, {});

  res
    .status(lambdaResponse.statusCode)
    .set(lambdaResponse.headers)
    .send(lambdaResponse.body);
});

module.exports = router;

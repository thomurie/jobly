"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");
const ash = require('express-async-handler')

const express = require("express");
const { ensureIsAdmin, ensureIsAdminOrUser } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const User = require("../models/user");
const { createToken } = require("../helpers/tokens");
const userNewSchema = require("../schemas/userNew.json");
const userUpdateSchema = require("../schemas/userUpdate.json");
const db = require("../db");

const router = express.Router();


/** POST / { user }  => { user, token }
 *
 * Adds a new user. This is not the registration endpoint --- instead, this is
 * only for admin users to add new users. The new user being added can be an
 * admin.
 *
 * This returns the newly created user and an authentication token for them:
 *  {user: { username, firstName, lastName, email, isAdmin }, token }
 *
 * Authorization required: Admin
 **/

router.post("/", ensureIsAdmin, ash(async (req, res) => {
  const validator = jsonschema.validate(req.body, userNewSchema);
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  const user = await User.register(req.body);
  const token = createToken(user);
  return res.status(201).json({ user, token });
}));


/** POST /[username]/jobs/[id] { user }  => { user, token }
 *
 * Applies a user to a job. 
 * The job can be applied for by the specific user or an admin.
 *
 * This returns the id of the newly applied for job:
 *  { applied: appliedId }
 *
 * Authorization required: Admin, Affected User
 **/
router.post("/:username/jobs/:id", ensureIsAdminOrUser, ash(async (req, res) => {
  const validator = jsonschema.validate(req.body, userNewSchema);
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  const { username, jobId } = req.params;

  const appliedId = await User.apply(username, jobId);
  return res.status(201).json({ applied: appliedId });
}));


/** GET / => { users: [ {username, firstName, lastName, email }, ... ] }
 *
 * Returns list of all users.
 *
 * Authorization required: logged in as Admin
 **/

router.get("/", ensureIsAdmin, ash(async (req, res) => {
  const users = await User.findAll();
  return res.json({ users });
}));


/** GET /[username] => { user }
 *
 * Returns { username, firstName, lastName, isAdmin }
 *
 * Authorization required: Admin, Affected User
 **/

router.get("/:username", ensureIsAdminOrUser, ash(async (req, res) => {
  const user = await User.get(req.params.username);
  return res.json({ user });
}));


/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *   { firstName, lastName, password, email }
 *
 * Returns { username, firstName, lastName, email, isAdmin }
 *
 * Authorization required: Admin, Affected User
 **/

router.patch("/:username", ensureIsAdminOrUser, ash(async (req, res) => {
  const validator = jsonschema.validate(req.body, userUpdateSchema);
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  const user = await User.update(req.params.username, req.body);
  return res.json({ user });
}));


/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: Admin, Affected User
 **/

router.delete("/:username", ensureIsAdminOrUser, ash(async (req, res) => {
    await User.remove(req.params.username);
    return res.json({ deleted: req.params.username });
}));


module.exports = router;

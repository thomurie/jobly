"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");
const ash = require('express-async-handler')

const { BadRequestError } = require("../expressError");
const { ensureIsAdmin } = require("../middleware/auth");
const Job = require("../models/job.js");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

const router = new express.Router();


/** POST / { job } =>  { job }
 *
 * Job should be { title, salary, equity, company_handle }
 *
 * Returns { id, title, salary, equity, company_handle }
 *
 * Authorization required: Admin
 */

router.post("/", ensureIsAdmin, ash(async (req, res) => {
    const validator = jsonschema.validate(req.body, jobNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await Job.create(req.body);
    return res.status(201).json({ job });
}));

/** GET /  =>
 *   { jobs: [ { id, title, salary, equity, company_handle }, ...] }
 *
 * Can filter on provided search filters:
 * - minSalary
 * - hasEquity
 * - title (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

router.get("/", async (req, res, next) => {
    try {
        const jobs = await Job.findAll();
        return res.json({ jobs });
    } catch (error) {
        next()
    }
});

/** GET /[id]  =>  { job }
 *
 *  job is { id, title, salary, equity, company_handle }
 *
 * Authorization required: none
 */

router.get("/:id", ash(async (req, res) => {
    const job = await Job.get(req.params.id);
    return res.json({ job });
}));

/** PATCH /[id] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: { name, description, numEmployees, logo_url }
 *
 * Returns { handle, name, description, numEmployees, logo_url }
 *
 * Authorization required: Admin
 */

router.patch("/:id", ensureIsAdmin, ash(async (req, res) => {
    const validator = jsonschema.validate(req.body, jobUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await Job.update(req.params.id, req.body);
    return res.json({ job });
}));

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization: Admin
 */

router.delete("/:id", ensureIsAdmin, ash(async (req, res) => {
    await Job.remove(req.params.id);
    return res.json({ deleted: req.params.id });
}));


module.exports = router;

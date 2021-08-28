"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, company_handle }
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * */

  static async create({ title, salary, equity, company_handle }) {
          const result = await db.query(
              `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle`,
              [
                  title,
                  salary,
                  equity,
                  company_handle
              ],
          );
      const job = result.rows[0];
      
      if(!job) throw new BadRequestError('Invalid Data Entry')
        
      return job;
  }

  /** Find all jobs.
   *
   * Returns [{ id, title, salary, equity, company_handle }, ...]
   * */

  static async findAll() {
    const jobsRes = await db.query(
          `SELECT *
           FROM jobs
           ORDER BY company_handle`);
    return jobsRes.rows;
  }

  /** Find a jobs based on filtering criteria 
   * 
   * Data can include: { title, minSalary, hasEquity }
   * 
   * Returns Returns [{ id, title, salary, equity, company_handle }, ...]
   * 
   * Throws NotFoundError if not found.
   * Throws BadRequestError if minSalary > maxSalary
  */
  
  static async find(reqQuery) {
    const keys = Object.keys(reqQuery);
    const criteria = []
    const vals = {}

    for (let idx = 0; idx < keys.length; idx++) {
      const element = keys[idx];
      if (element === 'title') {
        vals[idx + 1] = `%${reqQuery.title}%`;
        criteria.push(`title ILIKE $${idx + 1}`)
      }
        
      if (element === 'minSalary') {
        vals[idx + 1] = reqQuery.minSalary;
        criteria.push(`salary >= $${idx + 1}`)
          
        } if (element === 'hasEquity') {
            if (reqQuery.hasEquity === 'true') {
                criteria.push(`equity > 0`)
            }
      }
    }
    
    const statement = criteria.join(' AND ')

    const jobRes = await db.query(
      `SELECT *
       FROM jobs
       WHERE ${statement}
       ORDER BY id`,
    Object.values(vals));
    return jobRes.rows;
  }


  /** Given a job title, return data about job.
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
          `SELECT *
           FROM jobs
           WHERE id = $1`,
        [id]
    );

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Update job data with `data`.
   * 
   * Send: int: id, { obj: data }
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: { title, salary, equity }
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
            title: "title",
          salary: "salary",
          equity: "equity",
        });
    const idIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idIdx} 
                      RETURNING id, title, salary, equity, company_handle`
      
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
        [id]
    );
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}


module.exports = Job;

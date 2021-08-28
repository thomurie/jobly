"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
    const newJob = {
        title: "new",
        salary: 50000,
        equity: 0.1,
        company_handle: "c1",
    };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job.title).toEqual(newJob.title);

    const result = await db.query(
          `SELECT *
           FROM jobs
           WHERE id = ${job.id}`);
    expect(result.rows[0].title).toEqual("new");
  });

    test("bad request with invalid data", async function () {
        const badJob = {
            title: "new",
            company_handle: "c1",
        };
        try {
            await Job.create(badJob);
        } catch (err) {
        expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works", async function () {
      let jobs = await Job.findAll();
      expect(jobs.length).toEqual(6);
  });
});

/************************************** find(criteria) */
describe("find(criteria)", function () {
    test("works: with 1 filter", async function () {
        let [ job ] = await Job.find({ title: "j2" });
        expect(job.title).toEqual("j2");
        expect(job.salary).toEqual(2)
    });
    
    test("works: with 2 filters", async function () {
        let jobs= await Job.find({ minSalary: 2, title: 'j' });
        expect(jobs.length).toEqual(5);
    });
});
/************************************** get */

describe("get", function () {
  test("works", async function () {
      let jobs = await Job.get(3);
      expect(jobs.id).toEqual(3);
      expect(jobs.salary).toEqual(3);
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(1234);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "New",
    salary: 10,
    equity: 0.1,
  };

  test("works", async function () {
      let j = await Job.update(1, updateData);
      expect(j.title).toEqual('New');
      expect(j.salary).toEqual(10);

    const result = await db.query(
          `SELECT *
           FROM jobs
           WHERE id = 1`);
      expect(result.rows).toEqual([{
          id: 1,
        title: "New",
        salary: 10,
          equity: "0.1",
        company_handle: "c1"
      }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
        title: "New",
        salary: 10,
        equity: null,
    };

    let job = await Job.update(1, updateDataSetNulls);
    expect(job).toEqual({
        id: 1,
        company_handle: "c1",
      ...updateDataSetNulls,
    });

    const result = await db.query(
          `SELECT *
           FROM jobs
           WHERE id = 1`);
      expect(result.rows).toEqual([{
        id: 1,
        title: "New",
        salary: 10,
          equity: null,
          company_handle: "c1"
    }]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(1234, updateData);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(2, {});
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(1);
    const res = await db.query(
        "SELECT id FROM jobs WHERE id=1");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(1234);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

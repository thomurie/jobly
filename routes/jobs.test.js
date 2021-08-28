"use strict";

const request = require("supertest");

const db = require("../db.js");
const app = require("../app.js");
const Job = require("../models/job.js")

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    u1Token,
    u4Token
  } = require("./_testCommon");
  
  beforeAll(commonBeforeAll);
  beforeEach(commonBeforeEach);
  afterEach(commonAfterEach);
  afterAll(commonAfterAll);

/************************************** POST /jobs */

let specialId = null;

describe("POST /jobs", function () {
    const newJob = {
        title: "new",
        salary: 50000,
        equity: 0.1,
        company_handle: "c1",
    };

  test("ok for admins", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(201);
      expect(resp.body.job.title).toEqual("new");
      specialId = resp.body.job.id 
      console.log(specialId)
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
            title: "new",
            salary: 50000,
        })
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
            title: "new",
            salary: "50000",
            equity: '0.1',
            company_handle: "c1",
        })
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(400);
  });
  
  test("Errors for standard user", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });
});

/************************************** GET /jobs */

test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual(
      {
          jobs: [
            {
              id: 1,
              title: 'new1',
              salary: 10000,
              equity: '0.1',
              company_handle: 'c1'
            },
            {
              id: 2,
              title: 'new2',
              salary: 20000,
              equity: '0.2',
              company_handle: 'c2'
            },
            {
              id: 3,
              title: 'new3',
              salary: 30000,
              equity: '0.3',
              company_handle: 'c3'
            }
          ]
        }
    )
    });

/************************************** GET /jobs/:handle */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
      const resp = await request(app).get(`/jobs/1`);
      expect(resp.body).toEqual({
        job: {
            id: 1,
            title: 'new1',
            salary: 10000,
            equity: '0.1',
            company_handle: 'c1'
          }
        });
  });

  test("works for anon: job w/o jobs", async function () {
      const resp = await request(app).get(`/jobs/2`);
      expect(resp.body).toEqual(
        {
            job: {
              id: 2,
              title: 'new2',
              salary: 20000,
              equity: '0.2',
              company_handle: 'c2'
            }
          }
      );
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/1234`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for admin", async function () {
    const resp = await request(app)
        .patch(`/jobs/3`)
        .send({
          title: "J1-new",
        })
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.body.job.title).toEqual("J1-new");
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/jobs/1`)
        .send({
            title: "C1-new",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
        .patch(`/jobs/1234`)
        .send({
          title: "new nope",
        })
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on id change attempt", async function () {
    const resp = await request(app)
        .patch(`/jobs/1`)
        .send({
          id: 123,
        })
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
        .patch(`/jobs/1`)
        .send({
          title: 1,
        })
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("invalid token / not admin", async function () {
    const resp = await request(app)
        .patch(`/jobs/1`)
        .send({
          name: "J1-new",
        })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });
});

/************************************** DELETE /jobs/:handle */

describe("DELETE /jobs/:id", function () {
  test("works for admin", async function () {
    const resp = await request(app)
        .delete(`/jobs/1`)
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.body).toEqual({ deleted: "1" });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .delete(`/jobs/3`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
        .delete(`/jobs/1234`)
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("Not Admin", async function () {
    const resp = await request(app)
        .delete(`/jobs/3`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });
});

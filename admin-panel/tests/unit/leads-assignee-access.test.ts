import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import { leadsApi } from "@/features/leads/api/leadsApi";
import { leadsApiClient } from "@/features/leads/api/client";

const originalGet = leadsApiClient.get.bind(leadsApiClient);

afterEach(() => {
  leadsApiClient.get = originalGet;
});

test("getAdminUsers no longer filters valid staff assignees by legacy ADMIN role", async () => {
  leadsApiClient.get = (async () => ({
    data: {
      success: true,
      data: {
        items: [
          {
            id: 1,
            name: "Owner Admin",
            role: "ADMIN",
          },
          {
            id: 2,
            name: "Cashier Staff",
            role: "CASHIER",
          },
          {
            id: 3,
            name: "Legacy Delivery",
            role: "DELIVERY",
          },
        ],
      },
      message: null,
    },
  })) as typeof leadsApiClient.get;

  const users = await leadsApi.getAdminUsers();

  assert.deepEqual(
    users.map((user) => ({ id: user.id, name: user.name })),
    [
      { id: 1, name: "Owner Admin" },
      { id: 2, name: "Cashier Staff" },
      { id: 3, name: "Legacy Delivery" },
    ]
  );
});

test("getAdminUsers still ignores malformed assignee rows without usable identity", async () => {
  leadsApiClient.get = (async () => ({
    data: {
      success: true,
      data: [
        null,
        {},
        {
          id: 5,
          fullName: "Valid Staff User",
        },
      ],
      message: null,
    },
  })) as typeof leadsApiClient.get;

  const users = await leadsApi.getAdminUsers();

  assert.deepEqual(users.map((user) => user.id), [5]);
});

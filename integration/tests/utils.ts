import { Zero } from "@rocicorp/zero";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/node-postgres";
import path from "path";
import { Pool } from "pg";
import { GenericContainer, Network, PullPolicy } from "testcontainers";
import * as drizzleSchema from "../drizzle/schema";
import {
  allTypesTable,
  friendshipTable,
  mediumTable,
  messageTable,
  userTable,
} from "../drizzle/schema";
import { schema } from "../schema";

const PG_PORT = process.env.PG_VERSION === "17" ? 5732 : 5632;
const ZERO_PORT = process.env.PG_VERSION === "17" ? 5949 : 4949;

export const getNewZero = async () => {
  return new Zero({
    server: `http://localhost:${ZERO_PORT}`,
    userID: "1",
    schema: schema,
    kvStore: "mem",
  });
};

const pool = new Pool({
  host: "localhost",
  port: PG_PORT,
  user: "user",
  password: "password",
  database: "drizzle_zero",
});

export const db = drizzle(pool, {
  schema: drizzleSchema,
});

export const seed = async () => {
  await db.insert(mediumTable).values({ id: "1", name: "email" });
  await db.insert(mediumTable).values({ id: "2", name: "teams" });
  await db.insert(mediumTable).values({ id: "3", name: "sms" });
  await db.insert(mediumTable).values({ id: "4", name: "whatsapp" });

  await db.insert(userTable).values({ id: "1", name: "James", partner: true });
  await db.insert(userTable).values({ id: "2", name: "John", partner: false });
  await db.insert(userTable).values({ id: "3", name: "Jane", partner: false });

  await db.insert(messageTable).values({
    id: "1",
    body: "Hey, James!",
    senderId: "1",
    mediumId: "1",
    metadata: { key: "value1" },
  });

  await db.insert(messageTable).values({
    id: "2",
    body: "Hello on Teams",
    senderId: "2",
    mediumId: "2",
    metadata: { key: "value2" },
  });

  await db.insert(messageTable).values({
    id: "3",
    body: "SMS message here",
    senderId: "3",
    mediumId: "3",
    metadata: { key: "value3" },
  });

  await db.insert(messageTable).values({
    id: "4",
    body: "WhatsApp message",
    senderId: "2",
    mediumId: "4",
    metadata: { key: "value4" },
  });

  await db.insert(messageTable).values({
    id: "5",
    body: "Thomas!",
    senderId: "1",
    mediumId: "4",
    metadata: { key: "value5" },
  });

  await db.insert(allTypesTable).values({
    id: "1",
    smallintField: 1,
    integerField: 2,
    bigintField: 95807n,
    bigintNumberField: 444,
    numericField: "8.8",
    decimalField: "9.9",
    realField: 9,
    doublePrecisionField: 10,
    textField: "text",
    charField: "c",
    uuidField: randomUUID(),
    varcharField: "varchar",
    booleanField: true,
    timestampField: new Date(),
    timestampTzField: new Date(),
    timestampModeString: new Date().toISOString(),
    timestampModeDate: new Date(),
    dateField: new Date().toISOString(),
    jsonField: { key: "value" },
    jsonbField: { key: "value" },
    typedJsonField: { theme: "light", fontSize: 16 },
    statusField: "pending",
  });

  await db.insert(friendshipTable).values({
    requestingId: "1",
    acceptingId: "2",
    accepted: true,
  });
};

export const shutdown = async () => {
  await pool.end();
};

export const startPostgresAndZero = async () => {
  const network = await new Network().start();

  // Start PostgreSQL container
  const postgresContainer = await new PostgreSqlContainer(
    `postgres:${process.env.PG_VERSION ?? "16"}`,
  )
    .withDatabase("drizzle_zero")
    .withUsername("user")
    .withPassword("password")
    .withNetwork(network)
    .withNetworkAliases("postgres-db")
    .withExposedPorts({
      container: 5432,
      host: PG_PORT,
    })
    .withCommand([
      "postgres",
      "-c",
      "wal_level=logical",
      "-c",
      "max_wal_senders=10",
      "-c",
      "max_replication_slots=5",
      "-c",
      "hot_standby=on",
      "-c",
      "hot_standby_feedback=on",
    ])
    .withCopyDirectoriesToContainer([
      {
        source: path.join(__dirname, "../drizzle"),
        target: "/docker-entrypoint-initdb.d",
      },
    ])
    .withPullPolicy(PullPolicy.alwaysPull())
    .start();

  await seed();

  const basePgUrl = `postgresql://${postgresContainer.getUsername()}:${postgresContainer.getPassword()}@postgres-db:5432`;

  // Start Zero container
  const zeroContainer = await new GenericContainer(`rocicorp/zero:canary`)
    .withExposedPorts({
      container: 4848,
      host: ZERO_PORT,
    })
    .withNetwork(network)
    .withEnvironment({
      ZERO_UPSTREAM_DB: `${basePgUrl}/drizzle_zero`,
      ZERO_CVR_DB: `${basePgUrl}/drizzle_zero`,
      ZERO_CHANGE_DB: `${basePgUrl}/drizzle_zero`,
      ZERO_AUTH_SECRET: "secretkey",
      ZERO_REPLICA_FILE: "/zero.db",
      ZERO_NUM_SYNC_WORKERS: "1",
    })
    .withCopyFilesToContainer([
      {
        source: path.join(__dirname, "../zero-schema.json"),
        target: "/opt/app/zero-schema.json",
      },
    ])
    .withStartupTimeout(60000)
    .withPullPolicy(PullPolicy.alwaysPull())
    .start();

  return {
    postgresContainer,
    zeroContainer,
  };
};

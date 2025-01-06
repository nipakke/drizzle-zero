import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { drizzle } from "drizzle-orm/node-postgres";
import path from "path";
import { Pool } from "pg";
import { GenericContainer, Network } from "testcontainers";
import * as schema from "../drizzle/schema";
import { mediumTable, messageTable, userTable } from "../drizzle/schema";

const pool = new Pool({
  host: "localhost",
  port: 5632,
  user: "user",
  password: "password",
  database: "drizzle_zero",
});

const db = drizzle(pool, {
  schema,
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
  });

  await db.insert(messageTable).values({
    id: "2",
    body: "Hello on Teams",
    senderId: "2",
    mediumId: "2",
  });

  await db.insert(messageTable).values({
    id: "3",
    body: "SMS message here",
    senderId: "3",
    mediumId: "3",
  });

  await db.insert(messageTable).values({
    id: "4",
    body: "WhatsApp message",
    senderId: "2",
    mediumId: "4",
  });
};

export const shutdown = async () => {
  await pool.end();
};

export const startPostgresAndZero = async () => {
  const network = await new Network().start();

  // Start PostgreSQL container
  const postgresContainer = await new PostgreSqlContainer("postgres:16.1")
    .withDatabase("postgres")
    .withUsername("user")
    .withPassword("password")
    .withNetwork(network)
    .withNetworkAliases("postgres-db")
    .withExposedPorts({
      container: 5432,
      host: 5632,
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
    .start();

  await seed();

  const basePgUrl = `postgresql://${postgresContainer.getUsername()}:${postgresContainer.getPassword()}@postgres-db:5432`;

  // Start Zero container
  const zeroContainer = await new GenericContainer(
    "rocicorp/zero:0.10.2024122404-fdc0c8",
  )
    .withExposedPorts({
      container: 4848,
      host: 4949,
    })
    .withNetwork(network)
    .withEnvironment({
      ZERO_UPSTREAM_DB: `${basePgUrl}/drizzle_zero`,
      ZERO_CVR_DB: `${basePgUrl}/drizzle_zero_cvr`,
      ZERO_CHANGE_DB: `${basePgUrl}/drizzle_zero_cdb`,
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
    .start();

  return {
    postgresContainer,
    zeroContainer,
  };
};

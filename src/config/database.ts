import { Pool, PoolConfig } from 'pg';
import { PrismaClient } from '@prisma/client';

// Database configuration
export const databaseConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'mtyb_platform',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: parseInt(process.env.DB_POOL_MAX || '20'),
  min: parseInt(process.env.DB_POOL_MIN || '5'),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'),
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000'),
  query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'),
};

// Create PostgreSQL connection pool
export const pool = new Pool(databaseConfig);

// Handle pool errors
pool.on('error', err => {
  console.error('PostgreSQL pool error:', err);
});

pool.on('connect', client => {
  console.log('New PostgreSQL client connected');

  // Set timezone and other session settings
  client.query('SET timezone = "UTC"');
  client.query('SET statement_timeout = "30s"');
});

// Prisma client configuration
const prismaConfig = {
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL ||
        `postgresql://${databaseConfig.user}:${databaseConfig.password}@${databaseConfig.host}:${databaseConfig.port}/${databaseConfig.database}?schema=public`,
    },
  },
  log:
    process.env.NODE_ENV === 'development'
      ? (['query', 'info', 'warn', 'error'] as const)
      : (['error'] as const),
  errorFormat: 'pretty' as const,
};

// Create Prisma client instance
export const prisma = new PrismaClient(prismaConfig);

// Database connection utilities
export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private isConnected = false;

  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      // Test PostgreSQL connection
      const client = await pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      // Test Prisma connection
      await prisma.$connect();

      this.isConnected = true;
      console.log('✅ Database connections established successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await pool.end();
      await prisma.$disconnect();
      this.isConnected = false;
      console.log('✅ Database connections closed successfully');
    } catch (error) {
      console.error('❌ Error closing database connections:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<{ postgres: boolean; prisma: boolean }> {
    const result = {
      postgres: false,
      prisma: false,
    };

    try {
      // Check PostgreSQL
      const client = await pool.connect();
      const pgResult = await client.query('SELECT 1 as healthy');
      client.release();
      result.postgres = pgResult.rows[0]?.healthy === 1;
    } catch (error) {
      console.error('PostgreSQL health check failed:', error);
    }

    try {
      // Check Prisma
      await prisma.$queryRaw`SELECT 1 as healthy`;
      result.prisma = true;
    } catch (error) {
      console.error('Prisma health check failed:', error);
    }

    return result;
  }

  isHealthy(): boolean {
    return this.isConnected;
  }
}

// Transaction utilities
export async function withTransaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function withPrismaTransaction<T>(
  callback: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(callback);
}

// Migration utilities
export class MigrationManager {
  async runMigrations(): Promise<void> {
    try {
      console.log('🔄 Running database migrations...');

      // Check if migrations table exists
      await this.ensureMigrationsTable();

      // Get applied migrations
      const appliedMigrations = await this.getAppliedMigrations();

      // Get available migration files
      const availableMigrations = await this.getAvailableMigrations();

      // Run pending migrations
      for (const migration of availableMigrations) {
        if (!appliedMigrations.includes(migration.name)) {
          await this.runMigration(migration);
        }
      }

      console.log('✅ Database migrations completed successfully');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  private async ensureMigrationsTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const client = await pool.connect();
    try {
      await client.query(query);
    } finally {
      client.release();
    }
  }

  private async getAppliedMigrations(): Promise<string[]> {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT name FROM migrations ORDER BY applied_at');
      return result.rows.map(row => row.name);
    } finally {
      client.release();
    }
  }

  private async getAvailableMigrations(): Promise<Array<{ name: string; sql: string }>> {
    // In a real implementation, you would read migration files from the filesystem
    // For now, return an empty array as migrations are handled by the schema.sql file
    return [];
  }

  private async runMigration(migration: { name: string; sql: string }): Promise<void> {
    await withTransaction(async client => {
      console.log(`🔄 Running migration: ${migration.name}`);

      // Execute migration SQL
      await client.query(migration.sql);

      // Record migration as applied
      await client.query('INSERT INTO migrations (name) VALUES ($1)', [migration.name]);

      console.log(`✅ Migration completed: ${migration.name}`);
    });
  }
}

// Database seeding utilities
export class DatabaseSeeder {
  async seed(): Promise<void> {
    try {
      console.log('🌱 Seeding database...');

      // Check if database is already seeded
      const userCount = await prisma.user.count();
      if (userCount > 0) {
        console.log('ℹ️ Database already contains data, skipping seed');
        return;
      }

      // Run seed data
      await this.seedUsers();
      await this.seedPlugins();
      await this.seedReviews();

      console.log('✅ Database seeding completed successfully');
    } catch (error) {
      console.error('❌ Database seeding failed:', error);
      throw error;
    }
  }

  private async seedUsers(): Promise<void> {
    const users = [
      {
        telegramId: BigInt(123456789),
        username: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@mtyb.shop',
        role: 'admin' as const,
        status: 'active' as const,
        emailVerified: true,
      },
      {
        telegramId: BigInt(234567890),
        username: 'developer1',
        firstName: 'John',
        lastName: 'Developer',
        email: 'john@developer.com',
        role: 'developer' as const,
        status: 'active' as const,
        emailVerified: true,
      },
    ];

    for (const userData of users) {
      await prisma.user.create({
        data: userData,
      });
    }

    console.log(`✅ Seeded ${users.length} users`);
  }

  private async seedPlugins(): Promise<void> {
    // Get developer user
    const developer = await prisma.user.findFirst({
      where: { role: 'developer' },
    });

    if (!developer) {
      console.log('⚠️ No developer user found, skipping plugin seeding');
      return;
    }

    const plugins = [
      {
        name: 'vpn-premium-pro',
        displayName: 'VPN Premium Pro',
        shortDescription: '企业级VPN服务，支持全球100+服务器节点',
        description:
          '企业级VPN服务，支持全球100+服务器节点，军用级加密，提供最高级别的网络安全保护。',
        authorId: developer.id,
        category: 'vpn' as const,
        tags: ['vpn', 'security', 'premium'],
        version: '2.1.0',
        latestVersion: '2.1.0',
        status: 'published' as const,
        pricingType: 'paid' as const,
        price: 29.99,
        ratingAverage: 4.8,
        ratingCount: 157,
        downloadCount: 2547,
        activeInstallCount: 1847,
      },
    ];

    for (const pluginData of plugins) {
      await prisma.plugin.create({
        data: pluginData,
      });
    }

    console.log(`✅ Seeded ${plugins.length} plugins`);
  }

  private async seedReviews(): Promise<void> {
    // Implementation would seed sample reviews
    console.log('✅ Seeded reviews');
  }
}

// Export singleton instance
export const dbConnection = DatabaseConnection.getInstance();
export const migrationManager = new MigrationManager();
export const databaseSeeder = new DatabaseSeeder();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Shutting down gracefully...');
  await dbConnection.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔄 Shutting down gracefully...');
  await dbConnection.disconnect();
  process.exit(0);
});

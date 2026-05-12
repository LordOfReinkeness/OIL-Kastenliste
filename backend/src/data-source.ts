import 'dotenv/config';
import { DataSource } from 'typeorm';
import { join } from 'path';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'kastenliste',
  entities: [join(__dirname, '**', '*.entity.ts')],
  migrations: [join(__dirname, 'migrations', '*.ts')],
  synchronize: false,
});

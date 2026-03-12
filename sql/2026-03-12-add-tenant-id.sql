-- Añadir columna tenant_id a todas las tablas del esquema bovinos
alter table bovinos.animales add column if not exists tenant_id uuid;
alter table bovinos.pesajes add column if not exists tenant_id uuid;
alter table bovinos.insumos add column if not exists tenant_id uuid;
alter table bovinos.raciones add column if not exists tenant_id uuid;
alter table bovinos.eventos_sanitarios add column if not exists tenant_id uuid;
alter table bovinos.medicamentos add column if not exists tenant_id uuid;
alter table bovinos.escenarios add column if not exists tenant_id uuid;
alter table bovinos.ventas add column if not exists tenant_id uuid;
alter table bovinos.costos add column if not exists tenant_id uuid;
alter table bovinos.lot_movements add column if not exists tenant_id uuid;
alter table bovinos.change_records add column if not exists tenant_id uuid;
alter table bovinos.lotes add column if not exists tenant_id uuid;

-- Si ya hay datos, asignar temporalmente un tenant_id conocido antes de poner NOT NULL
-- update bovinos.<tabla> set tenant_id = '<algún-uuid>' where tenant_id is null;

-- Forzar NOT NULL una vez poblado
-- alter table bovinos.<tabla> alter column tenant_id set not null;

-- Índices por tenant
create index if not exists idx_animales_tenant on bovinos.animales(tenant_id);
create index if not exists idx_pesajes_tenant on bovinos.pesajes(tenant_id);
create index if not exists idx_insumos_tenant on bovinos.insumos(tenant_id);
create index if not exists idx_raciones_tenant on bovinos.raciones(tenant_id);
create index if not exists idx_eventos_sanitarios_tenant on bovinos.eventos_sanitarios(tenant_id);
create index if not exists idx_medicamentos_tenant on bovinos.medicamentos(tenant_id);
create index if not exists idx_escenarios_tenant on bovinos.escenarios(tenant_id);
create index if not exists idx_ventas_tenant on bovinos.ventas(tenant_id);
create index if not exists idx_costos_tenant on bovinos.costos(tenant_id);
create index if not exists idx_lot_movements_tenant on bovinos.lot_movements(tenant_id);
create index if not exists idx_change_records_tenant on bovinos.change_records(tenant_id);
create index if not exists idx_lotes_tenant on bovinos.lotes(tenant_id);

-- Políticas RLS sugeridas (ajusta si ya existen)
-- enable row level security on bovinos.<tabla>;
-- create policy "select_own" on bovinos.<tabla> for select using (tenant_id = auth.uid());
-- create policy "insert_own" on bovinos.<tabla> for insert with check (tenant_id = auth.uid());
-- create policy "update_own" on bovinos.<tabla> for update using (tenant_id = auth.uid()) with check (tenant_id = auth.uid());
-- create policy "delete_own" on bovinos.<tabla> for delete using (tenant_id = auth.uid());

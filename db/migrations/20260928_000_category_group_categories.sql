create table if not exists category_group_categories (
  group_id bigint not null references category_groups(id) on delete cascade,
  category_id bigint not null references categories(id) on delete cascade,
  primary key (group_id, category_id)
);

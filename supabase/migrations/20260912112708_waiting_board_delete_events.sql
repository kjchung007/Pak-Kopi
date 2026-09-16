-- Retain branch information in deletion events so filtered boards refresh after collection.
alter table public.waiting_board_entries replica identity full;

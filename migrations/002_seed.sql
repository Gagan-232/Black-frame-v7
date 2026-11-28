-- NIGHT SHIFT: real project entry. Pre-registration defaults to CLOSED. No invented description/stats.
INSERT INTO games (slug, title, tagline, status, is_published, prereg_open, price_paise)
VALUES ('night-shift', 'NIGHT SHIFT', 'A horror game by Black Frame Studio.', 'IN_DEVELOPMENT', true, false, 5900)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO site_settings (key, value) VALUES
  ('ads_enabled', 'true'), ('downloads_enabled', 'true'), ('registrations_enabled', 'true'),
  ('instagram_url', '"https://www.instagram.com/black_frame_frame_studio/"'), ('discord_url', '""')
ON CONFLICT (key) DO NOTHING;

-- Ad units supplied by the studio (public ad-unit keys, not secrets). Editable in Admin > Advertisements.
INSERT INTO advertisements (name, placement, ad_key, width, height, script_url) VALUES
  ('Rectangle 300x250', 'content', '70b9082466d21a06b2725c4dde6096f8', 300, 250, 'https://bicea.org/22/70b9082466d21a06b2725c4dde6096f8'),
  ('Banner 320x50', 'banner', '73e97d246347004d51fe2f71725d6e8c', 320, 50, 'https://bicea.org/22/73e97d246347004d51fe2f71725d6e8c');

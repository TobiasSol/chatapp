UPDATE messages SET content = CAST(content::json->>'content' AS TEXT) WHERE content_type = 'image' AND content::json->>'content' IS NOT NULL;

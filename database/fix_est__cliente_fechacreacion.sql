-- Opcional: ejecutar en phpMyAdmin si `FechaCreacion` queda NULL o sin default.
-- El API ya envía NOW() al crear; esto alinea la tabla con el resto del esquema.

USE `kalsan_moda`;

UPDATE `est__cliente`
SET `FechaCreacion` = NOW()
WHERE `FechaCreacion` IS NULL;

ALTER TABLE `est__cliente`
  MODIFY COLUMN `FechaCreacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

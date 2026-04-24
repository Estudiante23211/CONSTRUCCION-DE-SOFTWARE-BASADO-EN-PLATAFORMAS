-- Estado del pedido (cabecera): 1 Pendiente, 2 En proceso de envío, 3 Entregado, 4 Cancelado
USE `kalsan_moda`;

ALTER TABLE `com__pedidos`
  ADD COLUMN `Estado` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1=Pendiente,2=En proceso,3=Entregado,4=Cancelado' AFTER `IdTipoMoneda`;

UPDATE `com__pedidos` SET `Estado` = 1 WHERE `Estado` IS NULL OR `Estado` = 0;

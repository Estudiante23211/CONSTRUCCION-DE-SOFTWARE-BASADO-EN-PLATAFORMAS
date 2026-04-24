-- Base de datos kalsan_moda — esquema alineado con módulos Seguridad y Clientes.
-- MariaDB / MySQL 8. Ejecutar en phpMyAdmin o: mysql -u root < kalsan_moda_schema.sql

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS `kalsan_moda`
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `kalsan_moda`;

DROP TABLE IF EXISTS `com__pedidos_detalle`;
DROP TABLE IF EXISTS `com__pedidos`;
DROP TABLE IF EXISTS `com__inventario`;
DROP TABLE IF EXISTS `com__producto`;
DROP TABLE IF EXISTS `com__categoria_producto`;
DROP TABLE IF EXISTS `est__cliente`;
DROP TABLE IF EXISTS `seg__usuario`;
DROP TABLE IF EXISTS `seg__categoria_cliente`;
DROP TABLE IF EXISTS `seg__tipo_cliente`;
DROP TABLE IF EXISTS `bas__impuesto`;
DROP TABLE IF EXISTS `bas__tipo_moneda`;
DROP TABLE IF EXISTS `bas__unidad_medida`;
DROP TABLE IF EXISTS `seg__roles`;
DROP TABLE IF EXISTS `seg__tipo_identificacion`;

-- =========================
-- TABLAS BASE (seguridad)
-- =========================

CREATE TABLE `seg__tipo_identificacion` (
  `IdTipoIdentificacion` INT NOT NULL AUTO_INCREMENT,
  `Nombre` VARCHAR(200) DEFAULT NULL,
  `Descripcion` VARCHAR(200) DEFAULT NULL,
  `Estado` TINYINT(1) DEFAULT NULL,
  `UsuarioCreador` INT DEFAULT NULL,
  `FechaCreacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`IdTipoIdentificacion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `seg__roles` (
  `IdRoles` INT NOT NULL AUTO_INCREMENT,
  `Nombre` VARCHAR(200) DEFAULT NULL,
  `Descripcion` VARCHAR(200) DEFAULT NULL,
  `Estado` TINYINT(1) DEFAULT NULL,
  `UsuarioCreador` INT DEFAULT NULL,
  `FechaCreacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`IdRoles`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `seg__usuario` (
  `IdUsuario` INT NOT NULL AUTO_INCREMENT,
  `NumeroIdentificacion` VARCHAR(50) DEFAULT NULL,
  `IdRoles` INT DEFAULT NULL,
  `IdTipoIdentificacion` INT DEFAULT NULL,
  `Nombre` VARCHAR(200) DEFAULT NULL,
  `Apellido` VARCHAR(200) DEFAULT NULL,
  `Correo` VARCHAR(200) DEFAULT NULL,
  `Celular` VARCHAR(20) DEFAULT NULL,
  `Usuario` VARCHAR(200) DEFAULT NULL,
  `Clave` VARCHAR(200) DEFAULT NULL,
  `Estado` TINYINT(1) DEFAULT NULL,
  `UsuarioCreador` INT DEFAULT NULL,
  `FechaCreacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`IdUsuario`),
  UNIQUE KEY `uq_seg_usuario_num_id` (`NumeroIdentificacion`),
  UNIQUE KEY `uq_seg_usuario_correo` (`Correo`),
  UNIQUE KEY `uq_seg_usuario_login` (`Usuario`),
  KEY `idx_usuario_roles` (`IdRoles`),
  KEY `idx_usuario_tipo_id` (`IdTipoIdentificacion`),
  KEY `idx_usuario_estado` (`Estado`),
  CONSTRAINT `fk_usuario_roles` FOREIGN KEY (`IdRoles`) REFERENCES `seg__roles` (`IdRoles`),
  CONSTRAINT `fk_usuario_tipo_id` FOREIGN KEY (`IdTipoIdentificacion`) REFERENCES `seg__tipo_identificacion` (`IdTipoIdentificacion`),
  CONSTRAINT `fk_usuario_creador` FOREIGN KEY (`UsuarioCreador`) REFERENCES `seg__usuario` (`IdUsuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- CLIENTES (catálogos + maestro)
-- =========================

CREATE TABLE `seg__tipo_cliente` (
  `IdTipoCliente` INT NOT NULL AUTO_INCREMENT,
  `Nombre` VARCHAR(200) DEFAULT NULL,
  `Descripcion` VARCHAR(200) DEFAULT NULL,
  `Estado` TINYINT(1) DEFAULT NULL,
  `UsuarioCreador` INT DEFAULT NULL,
  `FechaCreacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`IdTipoCliente`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `seg__categoria_cliente` (
  `IdCategoriaCliente` INT NOT NULL AUTO_INCREMENT,
  `Nombre` VARCHAR(200) DEFAULT NULL,
  `Descripcion` VARCHAR(200) DEFAULT NULL,
  `Estado` TINYINT(1) DEFAULT NULL,
  `UsuarioCreador` INT DEFAULT NULL,
  `FechaCreacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`IdCategoriaCliente`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `est__cliente` (
  `IdCliente` INT NOT NULL AUTO_INCREMENT,
  `NumeroIdentificacion` VARCHAR(50) DEFAULT NULL,
  `IdTipoCliente` INT DEFAULT NULL,
  `IdCategoriaCliente` INT DEFAULT NULL,
  `IdTipoIdentificacion` INT DEFAULT NULL,
  `DigitoVerificacion` INT DEFAULT NULL,
  `Nombre` VARCHAR(200) DEFAULT NULL,
  `Apellidos` VARCHAR(200) DEFAULT NULL,
  `NombreComercial` VARCHAR(200) DEFAULT NULL,
  `RazonSocial` VARCHAR(200) DEFAULT NULL,
  `Direccion` VARCHAR(200) DEFAULT NULL,
  `Celular` VARCHAR(20) DEFAULT NULL,
  `Correo` VARCHAR(200) DEFAULT NULL,
  `Estado` TINYINT(1) DEFAULT NULL,
  `UsuarioCreador` INT DEFAULT NULL,
  `FechaCreacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`IdCliente`),
  UNIQUE KEY `uq_est_cliente_num_id` (`NumeroIdentificacion`),
  KEY `idx_cliente_tipo` (`IdTipoCliente`),
  KEY `idx_cliente_categoria` (`IdCategoriaCliente`),
  KEY `idx_cliente_estado` (`Estado`),
  CONSTRAINT `fk_cliente_tipo` FOREIGN KEY (`IdTipoCliente`) REFERENCES `seg__tipo_cliente` (`IdTipoCliente`),
  CONSTRAINT `fk_cliente_categoria` FOREIGN KEY (`IdCategoriaCliente`) REFERENCES `seg__categoria_cliente` (`IdCategoriaCliente`),
  CONSTRAINT `fk_cliente_tipo_id` FOREIGN KEY (`IdTipoIdentificacion`) REFERENCES `seg__tipo_identificacion` (`IdTipoIdentificacion`),
  CONSTRAINT `fk_cliente_usuario` FOREIGN KEY (`UsuarioCreador`) REFERENCES `seg__usuario` (`IdUsuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- PRODUCTOS
-- =========================

CREATE TABLE `com__categoria_producto` (
  `IdCategoria` INT NOT NULL AUTO_INCREMENT,
  `Nombre` VARCHAR(200) DEFAULT NULL,
  `Descripcion` VARCHAR(200) DEFAULT NULL,
  `Estado` TINYINT(1) DEFAULT NULL,
  `UsuarioCreador` INT DEFAULT NULL,
  `FechaCreacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`IdCategoria`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `com__producto` (
  `IdProducto` INT NOT NULL AUTO_INCREMENT,
  `Codigo` VARCHAR(50) DEFAULT NULL,
  `IdCategoria` INT DEFAULT NULL,
  `Nombre` VARCHAR(200) DEFAULT NULL,
  `Descripcion` VARCHAR(200) DEFAULT NULL,
  `Estado` TINYINT(1) DEFAULT NULL,
  `UsuarioCreador` INT DEFAULT NULL,
  `FechaCreacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`IdProducto`),
  UNIQUE KEY `uq_com_producto_codigo` (`Codigo`),
  KEY `idx_producto_categoria` (`IdCategoria`),
  CONSTRAINT `fk_producto_categoria` FOREIGN KEY (`IdCategoria`) REFERENCES `com__categoria_producto` (`IdCategoria`),
  CONSTRAINT `fk_producto_usuario` FOREIGN KEY (`UsuarioCreador`) REFERENCES `seg__usuario` (`IdUsuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- BÁSICOS
-- =========================

CREATE TABLE `bas__unidad_medida` (
  `IdUnidadMedida` INT NOT NULL AUTO_INCREMENT,
  `Nombre` VARCHAR(200) DEFAULT NULL,
  `Descripcion` VARCHAR(200) DEFAULT NULL,
  `Estado` TINYINT(1) DEFAULT NULL,
  `UsuarioCreador` INT DEFAULT NULL,
  `FechaCreacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`IdUnidadMedida`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bas__tipo_moneda` (
  `IdTipoMoneda` INT NOT NULL AUTO_INCREMENT,
  `Nombre` VARCHAR(200) DEFAULT NULL,
  `Descripcion` VARCHAR(200) DEFAULT NULL,
  `Estado` TINYINT(1) DEFAULT NULL,
  `UsuarioCreador` INT DEFAULT NULL,
  `FechaCreacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`IdTipoMoneda`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bas__impuesto` (
  `IdImpuesto` INT NOT NULL AUTO_INCREMENT,
  `Nombre` VARCHAR(200) DEFAULT NULL,
  `Descripcion` VARCHAR(200) DEFAULT NULL,
  `Porcentaje` DECIMAL(5,2) DEFAULT NULL,
  `Estado` TINYINT(1) DEFAULT NULL,
  `UsuarioCreador` INT DEFAULT NULL,
  `FechaCreacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`IdImpuesto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- INVENTARIO
-- =========================

CREATE TABLE `com__inventario` (
  `IdInventario` INT NOT NULL AUTO_INCREMENT,
  `IdProducto` INT DEFAULT NULL,
  `IdUnidadMedida` INT DEFAULT NULL,
  `CantidadInicial` INT DEFAULT NULL,
  `CantidadActual` INT DEFAULT NULL,
  `Alerta` INT DEFAULT NULL,
  `UsuarioCreador` INT DEFAULT NULL,
  `FechaCreacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`IdInventario`),
  KEY `idx_inventario_producto` (`IdProducto`),
  CONSTRAINT `fk_inventario_producto` FOREIGN KEY (`IdProducto`) REFERENCES `com__producto` (`IdProducto`),
  CONSTRAINT `fk_inventario_unidad` FOREIGN KEY (`IdUnidadMedida`) REFERENCES `bas__unidad_medida` (`IdUnidadMedida`),
  CONSTRAINT `fk_inventario_usuario` FOREIGN KEY (`UsuarioCreador`) REFERENCES `seg__usuario` (`IdUsuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- PEDIDOS
-- =========================

CREATE TABLE `com__pedidos` (
  `IdPedido` INT NOT NULL AUTO_INCREMENT,
  `IdCliente` INT DEFAULT NULL,
  `IdTipoMoneda` INT DEFAULT NULL,
  `Estado` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1=Pendiente,2=En proceso,3=Entregado,4=Cancelado',
  `UsuarioCreador` INT DEFAULT NULL,
  `FechaCreacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`IdPedido`),
  KEY `idx_pedido_cliente` (`IdCliente`),
  KEY `idx_pedido_fecha` (`FechaCreacion`),
  CONSTRAINT `fk_pedido_cliente` FOREIGN KEY (`IdCliente`) REFERENCES `est__cliente` (`IdCliente`),
  CONSTRAINT `fk_pedido_moneda` FOREIGN KEY (`IdTipoMoneda`) REFERENCES `bas__tipo_moneda` (`IdTipoMoneda`),
  CONSTRAINT `fk_pedido_usuario` FOREIGN KEY (`UsuarioCreador`) REFERENCES `seg__usuario` (`IdUsuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `com__pedidos_detalle` (
  `IdDetalle` INT NOT NULL AUTO_INCREMENT,
  `IdPedido` INT DEFAULT NULL,
  `IdProducto` INT DEFAULT NULL,
  `IdImpuesto` INT DEFAULT NULL,
  `Descripcion` VARCHAR(200) DEFAULT NULL,
  `Cantidad` INT DEFAULT NULL,
  `Medidas` TEXT,
  `PrecioUnitario` DECIMAL(10,2) DEFAULT NULL,
  `Descuento` DECIMAL(10,2) DEFAULT NULL,
  `Total` DECIMAL(10,2) DEFAULT NULL,
  `Fecha_entrega` DATETIME DEFAULT NULL,
  `Entregado_por` INT DEFAULT NULL,
  `EntregadoPorDescripcion` VARCHAR(200) DEFAULT NULL,
  `Recibido_por` VARCHAR(200) DEFAULT NULL,
  `Observacion` VARCHAR(200) DEFAULT NULL,
  `UsuarioCreador` INT DEFAULT NULL,
  `FechaCreacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`IdDetalle`),
  KEY `idx_detalle_pedido` (`IdPedido`),
  KEY `idx_detalle_producto` (`IdProducto`),
  KEY `idx_detalle_compuesto` (`IdPedido`, `IdProducto`),
  CONSTRAINT `fk_detalle_pedido` FOREIGN KEY (`IdPedido`) REFERENCES `com__pedidos` (`IdPedido`),
  CONSTRAINT `fk_detalle_producto` FOREIGN KEY (`IdProducto`) REFERENCES `com__producto` (`IdProducto`),
  CONSTRAINT `fk_detalle_impuesto` FOREIGN KEY (`IdImpuesto`) REFERENCES `bas__impuesto` (`IdImpuesto`),
  CONSTRAINT `fk_detalle_entregado` FOREIGN KEY (`Entregado_por`) REFERENCES `seg__usuario` (`IdUsuario`),
  CONSTRAINT `fk_detalle_usuario` FOREIGN KEY (`UsuarioCreador`) REFERENCES `seg__usuario` (`IdUsuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =========================
-- DATOS INICIALES
-- Contraseña para admin y ana: password (hash bcrypt; cambiar en producción)
-- =========================

INSERT INTO `seg__tipo_identificacion` (`Nombre`, `Estado`) VALUES
  ('Cédula', 1),
  ('NIT', 1);

INSERT INTO `seg__roles` (`Nombre`, `Estado`) VALUES
  ('Admin', 1),
  ('Vendedor', 1);

INSERT INTO `seg__usuario` (
  `NumeroIdentificacion`, `IdRoles`, `IdTipoIdentificacion`,
  `Nombre`, `Apellido`, `Correo`, `Celular`, `Usuario`, `Clave`, `Estado`, `UsuarioCreador`, `FechaCreacion`
) VALUES
  (
    '1001', 1, 1,
    'Carlos', 'Admin', 'admin@test.com', NULL, 'admin',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    1, NULL, NOW()
  ),
  (
    '1002', 2, 1,
    'Ana', 'Ventas', 'ana@test.com', NULL, 'ana',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    1, NULL, NOW()
  );

INSERT INTO `seg__tipo_cliente` (`Nombre`, `Estado`) VALUES
  ('Minorista', 1),
  ('Mayorista', 1);

INSERT INTO `seg__categoria_cliente` (`Nombre`, `Estado`) VALUES
  ('VIP', 1),
  ('Regular', 1);

INSERT INTO `est__cliente` (
  `NumeroIdentificacion`, `IdTipoCliente`, `IdCategoriaCliente`, `IdTipoIdentificacion`,
  `Nombre`, `Apellidos`, `Celular`, `Correo`, `Direccion`, `Estado`, `UsuarioCreador`, `FechaCreacion`
) VALUES
  ('9001', 1, 2, 1, 'Juan', 'Perez', '3001234567', 'juan.perez@mail.com', 'Calle 1 # 2-3', 1, NULL, NOW()),
  ('9002', 2, 1, 2, 'Empresa', 'XYZ', '3109876543', 'contacto@xyz.com', 'Carrera 7 # 40', 1, NULL, NOW());

INSERT INTO `com__categoria_producto` (`Nombre`, `Estado`) VALUES
  ('Camisas', 1),
  ('Pantalones', 1);

INSERT INTO `com__producto` (`Codigo`, `IdCategoria`, `Nombre`, `Estado`) VALUES
  ('CAM-AZ-001', 1, 'Camisa Azul', 1),
  ('PAN-NG-001', 2, 'Pantalón Negro', 1);

INSERT INTO `bas__unidad_medida` (`Nombre`, `Estado`) VALUES
  ('Unidad', 1);

INSERT INTO `bas__tipo_moneda` (`Nombre`, `Estado`) VALUES
  ('COP', 1);

INSERT INTO `bas__impuesto` (`Nombre`, `Porcentaje`, `Estado`) VALUES
  ('IVA', 19.00, 1);

INSERT INTO `com__inventario` (
  `IdProducto`, `IdUnidadMedida`, `CantidadInicial`, `CantidadActual`, `Alerta`
) VALUES
  (1, 1, 100, 80, 10),
  (2, 1, 50, 5, 10);

INSERT INTO `com__pedidos` (`IdCliente`, `IdTipoMoneda`, `Estado`, `FechaCreacion`) VALUES
  (1, 1, 1, NOW()),
  (2, 1, 1, NOW());

INSERT INTO `com__pedidos_detalle` (
  `IdPedido`, `IdProducto`, `IdImpuesto`, `Cantidad`, `PrecioUnitario`, `Total`, `FechaCreacion`
) VALUES
  (1, 1, 1, 2, 50000.00, 100000.00, NOW()),
  (1, 2, 1, 1, 80000.00, 80000.00, NOW()),
  (2, 2, 1, 3, 75000.00, 225000.00, NOW());

# 📌 Modelo de Datos - Sistema de Reservas de Karaoke

Este documento explica las **relaciones** entre las tablas (entidades) del sistema:  
**Users, Rooms, Reservations y Extras**.

---

## 🧑‍💻 Users (Usuarios)
- Tabla: `users`
- Cada usuario puede tener **muchas reservas**.
- Relación:
  - **1 Usuario → N Reservaciones** (OneToMany)
  - En la tabla `reservations` se guarda la `user_id` como **FK**.

👉 Ejemplo:  
Un usuario llamado *Juan Pérez* puede tener varias reservas en distintas fechas.

---

## 🎤 Rooms (Salas)
- Tabla: `rooms`
- Cada sala puede estar asociada a **muchas reservas**.
- Relación:
  - **1 Sala → N Reservaciones** (OneToMany)
  - En la tabla `reservations` se guarda la `room_id` como **FK**.

👉 Ejemplo:  
La *Sala VIP* puede estar reservada por varios usuarios en diferentes horarios.

---

## 📅 Reservations (Reservaciones)
- Tabla: `reservations`
- Es la **tabla central** que conecta usuarios, salas y extras.
- Relaciones:
  - **Muchos a Uno (N:1)** con `users`
  - **Muchos a Uno (N:1)** con `rooms`
  - **Muchos a Muchos (N:M)** con `extras` mediante la tabla intermedia `reservation_extras`.

👉 Ejemplo:  
Una reserva:
- Usuario: *Ana Torres*  
- Sala: *Sala Fiesta*  
- Extras: *Pizza + Barra Libre Premium*  

---

## 🍕 Extras (Servicios Adicionales)
- Tabla: `extras`
- Cada extra puede estar en **muchas reservas**.
- Relación:
  - **N Reservas ↔ N Extras** (ManyToMany)
  - Esta relación se guarda en la tabla intermedia `reservation_extras`.

👉 Ejemplo:  
El extra *Decoración Cumpleaños* puede ser parte de varias reservas.

---

## 🔗 Relaciones Resumidas

1. **User → Reservation**  
   - **Uno a Muchos (1:N)**  
   - Un usuario puede tener varias reservas.

2. **Room → Reservation**  
   - **Uno a Muchos (1:N)**  
   - Una sala puede estar en muchas reservas.

3. **Reservation ↔ Extra**  
   - **Muchos a Muchos (N:M)**  
   - Una reserva puede tener varios extras, y un extra puede estar en varias reservas.

---

## 📊 Diagrama Conceptual (simplificado)

```text
 Users (1) ────< Reservations >──── (1) Rooms
                    │
                    │ (N:M)
                    ▼
                 Extras

# Мини-платформа по бронированию (Next.js App Router)

Это демо-версия сервиса для создания и бронирования произвольных сущностей, разработанная на **Next.js**, **TypeScript**, **Tailwind CSS**, **Supabase**.

## Функциональность

### Роли

- **Админ (создатель)**
- **Юзер (Бронирующий)**

## Основные возможности

- **Аутентификация**: Регистрация и вход через Supabase Auth (email + пароль)
- **Управление сущностями (CRUD)**:
  - Сущность: "Место" (Place) с полями `name`, `address`, `capacity`, `image`
  - Создание новых мест (только для авторизованных пользователей с ролью `'admin'`)
  - Просмотр всех мест (для авторизованных пользователей с ролью `'user'`)
  - Просмотр только своих мест (для авторизованных пользователей с ролью `'admin'`)
  - Просмотр деталей конкретного места
- **Row Level Security (RLS)**: Настроены политики Supabase, чтобы админы видели только свои созданные места, а обычные пользователи видели все места
- **Генерация PDF**: Кнопка "Скачать PDF" на странице детализации объекта, генерирующая PDF с информацией о месте
- **Email-уведомления (симуляция)**: После регистрации пользователя и создания сущности происходит симуляция отправки email через Next.js API Route

## Технологический стек

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS, shadcn
- **Backend/DB/Auth**: Supabase
- **PDF Generation**: pdf-lib
- **Form Validation**: react-hook-form, zod

## Установка и Запуск

### 1. Клонирование Репозитория

```bash
    git clone https://github.com/evgenykoveshnikov/bookingApp.git
    cd bookingApp
```

### 2. Установка зависимостей

```bash
    npm install
```

### 3. Настройка Supabase

1. Зарегистрируйтесь на Supabase.com
2. Создайте новый проект
3. Перейдите в 'Project settings' -> 'API' и скопируйте `Project URL` и `anon public key`
4. Перейдите в 'Authentication' -> 'Sign In/Provider' -> Email и выключите тумблер `Confirm email`

### 4. Настройка переменных окружения

Создайте файл `.env.local` в корне вашего проекта и добавьте следующие переменные:

```bash
    NEXT_PUBLIC_SUPABASE_URL=ВАШ_SUPABASE_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=ВАШ_SUPABASE_ANON_KEY
```

Замените `ВАШ_SUPABASE_URL` и `ВАШ_SUPABASE_ANON_KEY` на значения из вашего проекта Supabase.

### 5. Настройка sql-схемы

1. Авторизоваться через supabase cli:
   ```bash
       npx supabase login
   ```
2. Привязать проект:
   ```bash
       npx supabase link
   ```
3. Запушить схему в supabase:
   ```bash
       npx supabase db push
   ```

### Запуск проекта

1. В режиме разработке:
   ```bash
       npm run dev
   ```
2. В режиме producation:
   ```bash
       npm run build
       npm run start
   ```

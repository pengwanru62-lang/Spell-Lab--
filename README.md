# SpellLab

一个包含前端与后端的全栈拼写训练项目，面向工程化发布与维护。

## 目录结构

```
github-ready/
  frontend/
    src/
      app/
      components/
      hooks/
      services/
      types/
  backend/
    src/main/java/com/spelllab/backend/
      controller/
      service/
      repository/
      entity/
      dto/
      common/
      config/
      security/
```

## 本地运行

### 前端

```
cd frontend
npm install
npm run dev
```

### 后端

```
cd backend
mvn spring-boot:run
```

## 环境变量

后端通过环境变量注入配置：

- DB_URL
- DB_USERNAME
- DB_PASSWORD
- MAIL_HOST
- MAIL_PORT
- MAIL_USERNAME
- MAIL_PASSWORD
- JWT_SECRET
- JWT_EXPIRE_MINUTES
- BAILIAN_APP_ID
- BAILIAN_ENABLED
- BAILIAN_ENDPOINT
- BAILIAN_API_KEY
- BAILIAN_MODEL

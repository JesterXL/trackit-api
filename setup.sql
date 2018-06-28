CREATE TABLE users (
    id              SERIAL,
    username            varchar(80) primary key,
    email               varchar(255),
    password            text,
    salt                text,
    date                date
);

CREATE TABLE events (
      id SERIAL PRIMARY KEY,
      name VARCHAR(40),
      long_description TEXT,
      short_description VARCHAR(250),
      city VARCHAR(25),
      state VARCHAR(25),
      start_time DATE,
      end_time DATE
);

CREATE TABLE project (
    id              SERIAL,
    date            date,
    name            varchar(255),
    userid          int
);

CREATE TABLE image (
    id              SERIAL,
    url             text,
    projectid       int
);


-- INSERT INTO users(username, email, password, date) VALUES ('jesterxl', 'jesse.warden@gmail', 'password', '2018-1-27');
-- INSERT INTO users(username, email, password, date) VALUES ('pixie', 'pixiepurls@gmail.com', 'password', '2018-1-27');
# Ludo

Browser version of Ludo, written in Javascript with Canvas for rendering and PHP + MariaDB

## Table of Contents
- [Introduction](#introduction)
- [Installation and setup](#installation-and-setup)
  - [Database schema](#database-schema)
- [Features](#features)
- [Future Development](#future-development)

## Introduction
The main goal of this project is to recreate the Ludo game and port it to browsers. The project was created as a school assignment.

## Installation and setup
- Clone or download the repository

`index.html` is the entry point.

**Note:** you need to provide basic server capabilities, mainly PHP + MariaDB backend.

Database connection settings can be configured in [respective file](/php/config.php).

### Database schema
#### board

| Field name       | Type       | Attributes                               | Default                 |
|------------------|------------|------------------------------------------|-------------------------|
|id                |int(11)     | NOT NULL, PRIMARY KEY, AUTO_INCREMENT    |None                     |
|game_id           |varchar(32) | NOT NULL                                 |None                     |
|board_data        |text        | NOT NULL                                 |None                     |
|player_data       |text        | NOT NULL                                 |None                     |
|current_players   |int(11)     | NOT NULL                                 |None                     |
|max_players       |int(11)     | NOT NULL                                 |None                     |
|open              |varchar(32) | NOT NULL                                 |None                     |
|state             |int(11)     | NOT NULL                                 |None                     |
|timestamp         |datetime    | NOT NULL, ON UPDATE CURRENT_TIMESTAMP()  |current_timestamp()      |

## Features
- Server-side checks preventing players from cheating, client-side rendering
- Session system, can rejoin game after window is closed
- Lobbies supporting 2-4 players
- Speech syntesis reading the rolled number
- Turn time limit, AFK kicks
- Move indicators showing only valid moves, if there is none turn time gets reduced

## Future Development
There are no plans regarding future development of this project
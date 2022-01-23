<?php
include("./config.php");
include("./util.php");
session_start();

if (isset($_SESSION["game_id"])) {
    echo (json_encode(["error" => "Session already exists!"]));
} else {
    if (isset($_POST) && mb_strlen($_POST["nick"], "UTF-8") >= 3) {
        //! Validate username
        $regexp = "/^[A-Za-z0-9 ]{3,}$/";

        if (preg_match($regexp, $_POST["nick"]) == 0) {
            echo (json_encode(["error" => "Invalid username!"]));
            return;
        }

        $link = mysqli_connect($hostname, $username, $password, $dbname);

        mysqli_query($link, "set names utf8");

        $query = 'SELECT COUNT(board.id) AS "freeGames" FROM board WHERE board.current_players < board.max_players AND board.state = 0;';
        $result = mysqli_query($link, $query);
        $arr = mysqli_fetch_all($result, MYSQLI_ASSOC);

        if ($arr[0]["freeGames"] == "0") {
            // create new board
            $boardID = randomString(32);

            $boardData = json_encode(emptyBoardData());

            $query = 'INSERT INTO board(game_id, board_data, player_data, current_players, max_players, open, state) VALUES(\'' . $boardID . '\', \'' . $boardData . '\', "{}", 0, 4, "OPEN", 0)';
            $result = mysqli_query($link, $query);

            InsertPlayerData($link, $boardID, $_POST["nick"]);

            $_SESSION["game_id"] = $boardID;
            echo (json_encode(["session" => "created"]));
        } else {
            // join first empty room
            $query = 'SELECT board.game_id FROM board WHERE board.current_players < board.max_players AND board.state = 0 LIMIT 1;';
            $result = mysqli_query($link, $query);
            $arr = mysqli_fetch_all($result, MYSQLI_ASSOC);

            InsertPlayerData($link, $arr[0]["game_id"], $_POST["nick"]);

            $_SESSION["game_id"] = $arr[0]["game_id"];
            echo (json_encode(["session" => "created"]));
        }
    } else {
        echo (json_encode(["error" => "Nick not set or too short (min. length is 3)!"]));
    }
}

function InsertPlayerData($link, $boardID, $nick) {
    $playerID = randomString();
    $_SESSION["player_id"] = $playerID;

    $colors = ["red", "yellow", "green", "blue"];

    $query = 'SELECT player_data, board_data FROM board WHERE board.game_id = "' . $boardID . '";';
    $result = mysqli_query($link, $query);
    $arr = mysqli_fetch_all($result, MYSQLI_ASSOC);

    $data = json_decode($arr[0]["player_data"], true);
    $board = json_decode($arr[0]["board_data"], true);

    foreach ($data as $player) {
        array_splice($colors, array_search($player["color"], $colors), 1);
    }

    $color = $colors[array_rand($colors, 1)];
    $_SESSION["color"] = $color;

    $data[$playerID] = emptyUserData($nick, $color);

    $fl = strtoupper($color[0]);

    $board["pawns"][$color] = (array)["H$fl-1", "H$fl-2", "H$fl-3", "H$fl-4"];

    $enData = json_encode($data);
    $enBoard = json_encode($board);

    $query = "UPDATE `board` SET `player_data`= '$enData', `board_data` = '$enBoard', `current_players` = `current_players` + 1 WHERE board.game_id = '$boardID';";
    $result = mysqli_query($link, $query);
}

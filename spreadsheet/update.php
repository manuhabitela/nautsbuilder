<?php
if (!empty($_POST) && !empty($_POST['pleaseUpdateTheDataForMePleasePleasePlease'])) {
	$lastUpdate = "window.leiminauts = window.leiminauts || {};\n
leiminauts.lastSpreadsheetUpdate = " . time()*1000 . "; //" . date('Y-m-d H:i:s');

	file_put_contents(dirname(__FILE__).'/../js/nautsbuilder/spreadsheet/last-update.js', $lastUpdate);

	header('Location:index.php');
}
<?php
if (!empty($_POST)) {
	$sheet = !empty($_POST['sheet']) ? $_POST['sheet'] : '';
	if (empty($sheet))
		return false;

	$characters = !empty($_POST['characters']) ? $_POST['characters'] : '';
	$skills = !empty($_POST['skills']) ? $_POST['skills'] : '';
	$upgrades = !empty($_POST['upgrades']) ? $_POST['upgrades'] : '';
	$data = array('characters' => $characters, 'skills' => $skills, 'upgrades' => $upgrades);

	$errors = 0;

	$lastUpdate = "window.leiminauts = window.leiminauts || {};\n
leiminauts.lastServerDataUpdate = " . time()*1000 . "; //" . date('Y-m-d H:i:s');

	foreach ($data as $type => $json) {
		$testJson = json_decode($json);
		if (json_last_error() == JSON_ERROR_NONE) {
			file_put_contents(dirname(__FILE__).'/'.$sheet.'-'.$type.'.json', $json);
			echo "\n", $sheet, ' ', $type, " ok";
		} else {
			$errors++;
			echo "\n\n\n";
			print_r($json);
			echo "\n", $sheet, ' ', $type, json_last_error(), " NOT OK MAN, NOT OKAY, OKAY?";
		}
	}

	if ($errors === 0 || $errors !== count($data)) {
		file_put_contents(dirname(__FILE__).'/last-update.js', $lastUpdate);
	}
}
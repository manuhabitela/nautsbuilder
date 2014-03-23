<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
		<title>Nautsbuilder - Awesomenauts builder: skills calculator, skills simulator - Make and share your Awesomenauts builds!</title>
		<meta name="description" content="">
		<meta name="viewport" content="width=device-width">
		<link rel="icon" type="image/png" href="../img/favicon.png">
		<?php if (!PROD): ?>
		<!-- <link rel="stylesheet" href="../css/style.css?v=<?php echo $v ?>"> -->
		<?php else: ?>
		<!-- <link rel="stylesheet" href="../dist/styles.min.css?v=<?php echo $v ?>"> -->
		<?php endif ?>
		<script src="../js/lib/modernizr.custom.js"></script>
	</head>
	<body>
		<!--[if lte IE 8]>
			<p class="obsolete-browser">You use an <strong>obsolete</strong> browser. <a href="http://browsehappy.com/">Upgrade it</a> to use the web <strong>safely</strong>!</p>
		<![endif]-->

		<div id="container">
			<p>If you continue, the Nautsbuiler will be updated with the current spreadsheet data.</p>
			<form action="/spreadsheet/update.php" method="post">
				<input type="hidden" name="pleaseUpdateTheDataForMePleasePleasePlease" value="1">
				<button>Ok, let's go</button>
			</form>

			<div class="data-updated-notice"></div>
		</div>

		<?php $now = time(); ?>
		<script src="../js/lib/jquery.min.js?v=<?php echo $now ?>"></script>
		<script src="../js/lib/underscore.js?v=<?php echo $now ?>"></script>
		<script src="../js/lib/backbone.js?v=<?php echo $now ?>"></script>
		<script src="../js/lib/backbone.localStorage.js?v=<?php echo $now ?>"></script>
		<script src="../js/lib/tabletop.js?v=<?php echo $now ?>"></script>
		<script src="../js/nautsbuilder/utils.js?v=<?php echo $now ?>"></script>
		<script src="../data/last-update.js?v=<?php echo $now ?>"></script>
		<script src="../js/nautsbuilder/spreadsheet/last-update.js?v=<?php echo $now ?>"></script>
		<script src="../js/nautsbuilder/spreadsheet/update.js?v=<?php echo $now ?>"></script>
		<script>
			var _gaq=[['_setAccount','UA-13184829-6'],['_trackPageview']];
			(function(d,t){var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
			g.src=('https:'==location.protocol?'//ssl':'//www')+'.google-analytics.com/ga.js';
			s.parentNode.insertBefore(g,s)}(document,'script'));
			$(window).on('hashchange', function(){
			    _gaq.push(['_trackPageview', location.pathname + location.search + location.hash]);
			});
		</script>
	</body>
</html>

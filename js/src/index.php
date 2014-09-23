<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>UgUp Test - KongE - Kongregate Enhanced Platform</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="UgUp Test - KongE - Kongregate Enhanced Platform: Improving the Kongregate experience through addons">
    <meta name="author" content="COQuI - doomcat">

    <!-- Le styles -->
    <link href="/inc/bootstrap/css/bootstrap.min.css" rel="stylesheet">
    <link href="/css/subnav.css" rel="stylesheet">

    <!-- HTML5 shim, for IE6-8 support of HTML5 elements -->
    <!--[if lt IE 9]>
      <script src="/inc/js/html5shiv.js"></script>
    <![endif]-->

  </head>

  <body data-spy="scroll" data-target=".subnav" data-offset="100">

    <?php
        include "../../../inc/nav.php";
    ?>

    <div class="container" style="padding-top: 50px;">

      <div id="ugup-api-header" class="clearfix">
          <select id="ugup-api-picker" style="pull-left">
            <option> Select an API Call </option>
          </select>
          <div id="ugup-api-params">
          </div>
          <button type="button" class="pull-right btn btn-primary">Run API Query</button>
      </div>
      <div id="ugup-api-results"></div>

      <hr>

      <footer>
        <p>&copy; COQuI - doomcat et al</p>
      </footer>

    </div> <!-- /container -->

    <!-- Le javascript
    ================================================== -->
    <!-- Placed at the end of the document so the pages load faster -->
    <script src="http://code.jquery.com/jquery.js"></script>
    <script src="/inc/bootstrap/js/bootstrap.js"></script>
<!--    <script src="https://rawgit.com/doomcat/OpenUgUp/master/js/src/ugup.js"></script> -->
<!--    <script src="https://rawgit.com/doomcat/OpenUgUp/master/js/src/ugup.js"></script> -->
    <script src="js/ugup.js"></script>
    <script src="js/ugup.page.js"></script>
    <?php
        include "../../../inc/footer.php";
    ?>
  </body>
</html>

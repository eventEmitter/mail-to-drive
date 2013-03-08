	

	var Application 	= require( "./app" )
		, config 		= require( "./config" );



	var printLogo = function( productName, version ){
		var productString = ( ( productName || "noname" ) + "/" + ( version.toString().indexOf( "." ) === -1 ? ( version.toString() + ".0" ) : version.toString() || "1.0" ) ).white.bold;
			
		var logo = [
			  "\n"
			, "                              . .  ,  , ".yellow.bold
			, "                              |` \\/ \\/ \\,', ".yellow.bold
			, "                              ;          ` \\/\,. ".yellow.bold
			, "                             :               ` \\,/ ".yellow.bold
			, "                             |                  / ".yellow.bold
			, "                             ;                 : ".yellow.bold
			, "                            :                  ; ".yellow.bold
			, "                            |      ,---.      / ".yellow.bold
			, "                           :     ,'     `,-._ \\ ".yellow.bold
			, "                           ;    (   ".yellow.bold + "o".white + "    \\   `' ".yellow.bold
			, "                         _:      .      ,'  ".yellow.bold + "o".white + " ; ".yellow.bold
			, "                        /,.`      `.__,'`-.__, ".yellow.bold
			, "                        \\_  _               \\ ".yellow.bold
			, "                       ,'  / `,          `.,' ".yellow.bold
			, "                 ___,'`-.".yellow + "_ \\_".yellow.bold + "/".white + " `,._        ; ".yellow.bold
			, "             __;_,'      `-.".yellow + "`-'.".yellow.bold + "/".white + " `--.____) ".yellow.bold
			, "          ,-'           _,--\\".yellow + "^-' ".yellow.bold
			, "         ,:_____      ,-'     \\ ".yellow
			, "        :    Y".yellow.bold + "      `-".yellow + "/".yellow.bold + "    `,  : ".yellow
			, "        :    :       :     /".yellow.bold + "_;' ".yellow + "       ___   ________     ___   _______     ___   ___   ___   ___    ___".white
			, "        :    :       |    : ".yellow.bold + "          |   | |        `.  |   | |       `.  |   | |   | |   | |   \\  /   |".white
			, "         \\    \\      :    : ".yellow.bold + "          |   | |   .-.   |  |   | |   ...   | |   | |   | |   | |    \\/    |".white
			, "          `-._ `-.__, \\    `. ".yellow.bold + "        |   | |   |_;   |  |   | |   | |   | |   | |   | |   | |          |".white
			, "             \\   \\  `. \\     `. ".yellow.bold + "      |   | |       |´   |   | |   | |   | |   | |   | |   | |   |\\/|   |".white
			, "           ,-".blue.bold + ";".yellow.bold + "    ".blue.bold + "\\".yellow.bold + "---".blue.bold + ")".yellow.bold + "_".blue.bold + "\\ ,','/ ".yellow.bold + "      |   | |   |\\   \\   |   | |   | |   | |   | |   | |   | |   |  |   |".white
			, "           \\_ `---".blue.bold + "'".yellow.bold + "--'\" ,".blue.bold + "'^".yellow.bold + "-;".yellow.bold + "'".yellow.bold + "        |   | |   | \\   \\  |   | |    \"    | |   | |    \"    | |   |  |   |".white
			, "           (_`     ---'\" ,-') ".blue.bold + "        |___| |___|  \\___\\ |___| |________.' |___|  \\________| |___|  |___|".white
			, "           / `--.__,. ,-'    \\ ".blue.bold + "        ___                ___               ___".white
			, "           )-.__,-- ||___,--' `-. ".blue.bold + "    |___|              |___|             |___|".white + new Array( ( productString.length < 45 ? 45 - productString.length : 2) ).join( " " ) + productString 
			, "          /".white + "._______,|__________,'".blue.bold+"\\ ".white
			, "         `--.____,'|_________,-'´".white
			, "\n\n"
		];

		logo.forEach( function( item ){
			console.log( item.green );
		}.bind( this ) );
	}

	printLogo( "mail2drive", 0.1 );

 	
	new Application( config );
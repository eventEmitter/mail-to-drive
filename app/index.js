


	var   Events 		= require( "../lib/events" )
		, Class			= require( "../lib/class" )
		, log 			= require( "../lib/log" )
		, moment 		= require( "../lib/moment" );
		

	var   Imap 			= require( "imap" )
		, request 		= require( "request" )
		, Mailparser 	= require( "mailparser" ).MailParser
		, OCR 			= require( "pdf-extract" );


	var   fs 			= require( "fs" )
		, path 			= require( "path" );




	module.exports = new Class( {


		init: function( config ){	
			this.__config = config;
			//log.dir( config );

			this.__imap = new Imap( this.__config.imap );
			this.__imap.on( "mail", this.__fetchMails.bind( this ) );
			this.__imap.on( "close", this.__handleClose.bind( this ) );

			this.__fecthMail();
		}


		, __doOcr: function( document, callback ){
			var tempPath = path.resolve( __dirname, "../temp/" + Math.random() + "_" + Date.now() + ".pdf.pdf" );
			fs.writeFile( tempPath, document, function( err ){
				if ( err ) callback ( err );
				else {
					var ocr = OCR( tempPath, { type: "ocr" }, function( err ){
						if ( err ) {
							callback ( err );
							fs.unlink( tempPath );
						}
					}.bind( this ) );

					ocr.on( "complete", function( data ){
						callback( null, data );
						fs.unlink( tempPath );
					}.bind( this ) );

					ocr.on( "error", function( err ){
						callback( err );
						fs.unlink( tempPath );
					}.bind( this ) );
				}
			}.bind( this ) );
		}



		, __storeDocument: function( document ){
			log.info( "got document, length:", document.length );
			var m = moment();


			log.info( "extracting text ....", this );
			this.__doOcr( document, function( err, data ){
				var filename = "scan", text = "";
				if ( data && data.text_pages ){
					text = data.text_pages.join( " " );
					
					var   entity 	= ( new RegExp( "(" + this.__config.ocr.entities.join( "|" ) + ")", "gi" ).exec( text ) || [ "", "" ] )[ 1 ] 
						, klass 	= ( new RegExp( "(" + this.__config.ocr.classes.join( "|" ) + ")", "gi" ).exec( text ) || [ "", "" ] )[ 1 ] ;

					if ( klass ) filename = klass;
					if ( entity ){
						if ( klass ) filename += "-" + entity;
						else filename = entity;
					}					
				}

				this.__getOAuthToken( function( err, token ){
					if ( err ) log.trace( err );
					else {
						request( {
							  uri: "https://www.googleapis.com/upload/drive/v2/files"
							, method: "POST"
							, qs: {
								  uploadType: 					"multipart"
								, access_token: 				token
							}
							, multipart: [
								{
									  "content-type": "application/json"
									, body: JSON.stringify( {
										  title: 					m.format( "YYYY" ) + "-" + m.format( "MMMM" ) + "-" + filename + ".pdf"
										, description: 				"Scanned @ the Joinbox HQ"
										, mimeType: 				"application/pdf"
										, "indexableText.text": 	text
										, "parents": 				[ { id: "0B6wMaOR1qteTSS1vcEhCd2RqZ3M" } ]
									} )
								}
								, {
									  "content-type": "application/pdf"
									, "Content-Transfer-Encoding": "base64"
									, body: document.toString( "base64" )
								}
							]
						}, function( err, response, body ){
							log.trace( err );
							log.info( "upload was successfull .." );
						}.bind( this ) );
					}
				}.bind( this ) );	

			}.bind( this ) );
		}



		, __getOAuthToken: function( callback ){

			if ( this.__accesstoken && this.__expires > Date.now() ){
				callback( null, this.__accesstoken );
			}
			else {

				request( {
					  uri: "https://accounts.google.com/o/oauth2/token"
					, method: "POST"
					, form: {
						  client_id: 		this.__config.drive.clientId
						, client_secret: 	this.__config.drive.clientSecret
						, refresh_token: 	this.__config.drive.refreshToken
						, grant_type: 		"refresh_token"
					}
				}, function( err, response, body ){
					log.trace( err );
					if ( ! err ){
						var res;
						try {
							res = JSON.parse( body );
						} catch ( e ) {
							return callback( e );
						}

						if ( res.access_token ){
							log.info( "got a new accesstoken", res.access_token, this );
							this.__accesstoken = res.access_token;
							this.__expires = Date.now() + 1000 * parseInt( res.expires_in, 10 ) - 120000;
							callback( null, this.__accesstoken );
						}
						else {
							callback( new Erorr( "failed to get accesstoken" ) );
						}
					} else {
						callback( err );
					}
				}.bind( this ) );
			}
		}


		, __handleMailMessage: function( mailMessage ){			
			//log.dir( mailMessage );

			if ( mailMessage.attachments ){
				mailMessage.attachments.forEach( function( attachment ){
					if ( attachment.contentType === this.__config.filters.type ){
						this.__storeDocument( attachment.content );
					}
				}.bind( this ) );
			}
		}



		, __handleClose: function( err ){
			log.trace( err );
			setTimeout( this.__fetchMail.bind( this ), 60000 );
		}


		, __fecthMail: function(){
			this.__imap.connect( function( err ){
				if ( err ) log.trace( err );
				else {
					this.__imap.openBox( "INBOX", false, function( err, mailbox ){
						if ( err ) log.trace( err );
						else this.__fetchMails();
					}.bind( this ) );
				}
			}.bind( this ) );
		}



		, __fetchMails: function(){
			this.__imap.search( [ "UNSEEN", [ "FROM", this.__config.filters.from ] ], function( err, list ){
				if ( err ) log.trace( err );
				else {
					if ( list && list.length > 0 ){
						this.__imap.fetch( list, { headers: { parse: false }, body: true, cb: function( fetch ){
							fetch.on( "message", function( message ){
								var parser = new Mailparser();

								parser.on( "end", this.__handleMailMessage.bind( this ) );

								message.on( "data", parser.write.bind( parser ) );

								message.on( "end", function(){
									parser.end();
									this.__imap.addFlags( fetch._msg.uid, "Seen", function( err ){
										log.trace( err );
									}.bind( this ) );
								}.bind( this ) );
							}.bind( this ) );
						}.bind( this ) } );
					}
				}
			}.bind( this ) );
		}
	} );
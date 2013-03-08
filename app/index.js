


	var   Events 		= require( "../lib/events" )
		, Class			= require( "../lib/class" )
		, log 			= require( "../lib/log" )
		, moment 		= require( "../lib/moment" );
		

	var   Imap 			= require( "imap" )
		, request 		= require( "request" )
		, Mailparser 	= require( "mailparser" ).MailParser;



	module.exports = new Class( {


		init: function( config ){	
			this.__config = config;
			//log.dir( config );

			this.__imap = new Imap( this.__config.imap );
			this.__imap.on( "mail", this.__fetchMails.bind( this ) );
			this.__imap.on( "close", this.__handleClose.bind( this ) );

			this.__fecthMail();
		}


		, __storeDocument: function( document ){
			log.info( "got document, length:", document.length );
			var m = moment();

			this.__getOAuthToken( function( err, token ){
				if ( err ) log.trace( err );
				else {
					request( {
						  uri: "https://www.googleapis.com/upload/drive/v2/files"
						, method: "POST"
						, qs: {
							  uploadType: 					"multipart"
							, ocr: 							true
							, ocrLanguage: 					"de"
							, useContentAsIndexableText: 	true
							, access_token: 				token
						}
						, multipart: [
							{
								  "content-type": "application/json"
								, body: JSON.stringify( {
									  title: 			"documents/scanned/" + m.format( "YYYY" ) + "/" + m.format( "MMMM" ) + "/test.pdf"
									, description: 		"Scanned @ the Joinbox HQ"
									, mimeType: 		"application/pdf"
									, "parents[]": 			[ "documents" ]
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
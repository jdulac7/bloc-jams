// Sets the current playing song number and current song
var setSong = function(songNumber) {
  if (currentSoundFile) {
        currentSoundFile.stop();
    }
    currentlyPlayingSongNumber = parseInt(songNumber);
    currentSongFromAlbum = currentAlbum.songs[songNumber - 1];


  // set the CSS of the volume seek bar to equal the currentVolume
   var $volumeFill = $('.volume .fill');
   var $volumeThumb = $('.volume .thumb');
   $volumeFill.width(currentVolume + '%');
   $volumeThumb.css({left: currentVolume + '%'});


    // #1
    currentSoundFile = new buzz.sound(currentSongFromAlbum.audioUrl, {
        // #2
        formats: [ 'mp3' ],
        preload: true
    });


    // seek to corresponding position in song with seek bar
    var seek = function(time) {
    if (currentSoundFile) {
        currentSoundFile.setTime(time);
    }
}


//set volume
    setVolume(currentVolume);
};

var setVolume = function(volume) {
    if (currentSoundFile) {
        currentSoundFile.setVolume(volume);
    }
};

var getSongNumberCell = function(number) {
    return $('.song-item-number[data-song-number="' + number + '"]');
};
// Function that generates the song row content
var createSongRow = function (songNumber, songName, songLength) {
    var template =
        '<tr class="album-view-song-item">'
    +   '   <td class="song-item-number" data-song-number="' + songNumber + '">' + songNumber + '</td>'
    +   '   <td class="song-item-title">' + songName + '</td>'
    +   '   <td class="song-item-duration">' + timeCode(songLength) + '</td>'
    +   '</tr>'
    ;

    var $row = $(template);

    var clickHandler = function() {
        var songNumber = parseInt($(this).attr('data-song-number'));

        if (currentlyPlayingSongNumber !== null) {
            // Revert to song number for currently playing song because user started playing new song.
            var currentlyPlayingCell = getSongNumberCell(currentlyPlayingSongNumber);
            currentlyPlayingCell.html(currentlyPlayingSongNumber);

        // update time when thumbing
        updateSeekBarWhileSongPlays();
        }

        if (currentlyPlayingSongNumber !== songNumber) {
            // Switch from Play -> Pause button to indicate new song is playing.
            $(this).html(pauseButtonTemplate);
            setSong(songNumber);
            currentSoundFile.play();
            // update time when thumbing
            updateSeekBarWhileSongPlays();
            updatePlayerBarSong();
        } else if (currentlyPlayingSongNumber === songNumber) {
          if (currentSoundFile.isPaused()) {
                $(this).html(pauseButtonTemplate);
                $('.main-controls .play-pause').html(playerBarPauseButton);
                currentSoundFile.play();
            } else {
                $(this).html(playButtonTemplate);
                $('.main-controls .play-pause').html(playerBarPlayButton);
                currentSoundFile.pause();
           }
        }
    };

    var onHover = function(event) {
        var songNumberCell = $(this).find('.song-item-number');
        var songNumber = songNumberCell.attr('data-song-number');

        if (songNumber !== currentlyPlayingSongNumber) {
            songNumberCell.html(playButtonTemplate);
        }
    };

    var offHover = function(event) {
        var songNumberCell = $(this).find('.song-item-number');
        var songNumber = songNumberCell.attr('data-song-number');
          console.log("songNumber type is " + typeof songNumber + "\n and currentlyPlayingSongNumber type is " + typeof currentlyPlayingSongNumber);

        if(songNumber !== currentlyPlayingSongNumber) {
            songNumberCell.html(songNumber);

        }
    };

    $row.find('.song-item-number').click(clickHandler);
    $row.hover(onHover, offHover);

    return $row;
};

// When window loads, will take album object as template and use info to inject into template
var setCurrentAlbum = function(album) {
      currentAlbum = album;
      // Select elements that we want to populate with text dynamically
      var $albumTitle = $('.album-view-title');
      var $albumArtist = $('.album-view-artist');
      var $albumReleaseInfo = $('.album-view-release-info');
      var $albumSongList = $('.album-view-song-list');

    $albumTitle.text(album.title);
    $albumArtist.text(album.artist);
    $albumReleaseInfo.text(album.year + ' ' + album.label);
    $albumImage.attr('src', album.albumArtUrl);

    $albumSongList.empty();

    for (var i=0; i<album.songs.length; i++) {
        var $newRow = createSongRow(i + 1, album.songs[i].title, album.songs[i].duration);
        $albumSongList.append($newRow);
    }

};

//make seek bars functional to changing time of song
var updateSeekBarWhileSongPlays = function() {
    if (currentSoundFile) {
        // #10
        currentSoundFile.bind('timeupdate', function(event) {
            // #11
            var seekBarFillRatio = this.getTime() / this.getDuration();
            var $seekBar = $('.seek-control .seek-bar');

            //  sets text of the element with the .current-time class to the current time in the song.
            var setCurrentTimeInPlayerBar = function(currentTime) {
              // Set text of current time to argument
                 $('.currently-playing .current-time').text(timeCode(currentTime));
                 };

              setCurrentTimeInPlayerBar(this.getTime());
              updateSeekPercentage($seekBar, seekBarFillRatio);
                      });
                  }
 };
// move seek bar
var updateSeekPercentage = function($seekBar, seekBarFillRatio) {
   var offsetXPercent = seekBarFillRatio * 100;
   // #1 make sure % isn't less than 0 or more than 100
   offsetXPercent = Math.max(0, offsetXPercent);
   offsetXPercent = Math.min(100, offsetXPercent);

   // #2 convert percentage to string and set value of .fill and .thumb
   var percentageString = offsetXPercent + '%';
   $seekBar.find('.fill').width(percentageString);
   $seekBar.find('.thumb').css({left: percentageString});
};

var setupSeekBars = function() {
    var $seekBars = $('.player-bar .seek-bar');

// configure seek bars
    $seekBars.click(function(event) {
        // #3 holds the X (or horizontal) coordinate at which the event occurred
        var offsetX = event.pageX - $(this).offset().left;
        var barWidth = $(this).width();
        // #4 divide offsetX by the width of the entire bar to calculate seekBarFillRatio.
        var seekBarFillRatio = offsetX / barWidth;

        //sets volume to move
        if ($(this).parent().attr('class') == 'seek-control') {
            seek(seekBarFillRatio * currentSoundFile.getDuration());
        } else {
            setVolume(seekBarFillRatio * 100);
        }


        // #5
        updateSeekPercentage($(this), seekBarFillRatio);
    });

// click and drag seek bars
// #7
     $seekBars.find('.thumb').mousedown(function(event) {
         // #8 uses parent to find whichever parent '.thumb' belongs to (two seek bars)
         var $seekBar = $(this).parent();

         // #9 binding to document allows drag the thumb after mousing down,
         // even when the mouse leaves the seek bar
         $(document).bind('mousemove.thumb', function(event){
             var offsetX = event.pageX - $seekBar.offset().left;
             var barWidth = $seekBar.width();
             var seekBarFillRatio = offsetX / barWidth;

             //sets volume to move
             if ($seekBar.parent().attr('class') == 'seek-control') {
                 seek(seekBarFillRatio * currentSoundFile.getDuration());
             } else {
                 setVolume(seekBarFillRatio);
             }

             updateSeekPercentage($seekBar, seekBarFillRatio);
         });

         // #10 unbind so it doesn't stay clicking/dragging
         $(document).bind('mouseup.thumb', function() {
             $(document).unbind('mousemove.thumb');
             $(document).unbind('mouseup.thumb');
         });
     });
};
//return index of a song found in index array
var trackIndex = function(album, song) {
     return album.songs.indexOf(song);
 };



var nextSong = function() {
    var currentSongIndex = trackIndex(currentAlbum, currentSongFromAlbum);

    // incrementing the song here
    currentSongIndex++;

    if (currentSongIndex >= currentAlbum.songs.length) {
        currentSongIndex = 0;
    }

    // Save the last song number before changing it
    var lastSongNumber = currentlyPlayingSongNumber;

    // Set a new current song
     setSong(currentSongIndex + 1);
     currentSoundFile.play();

      // update time when thumbing
      updateSeekBarWhileSongPlays();
      // Update the Player Bar information
      updatePlayerBarSong();

    var $nextSongNumberCell = getSongNumberCell(currentlyPlayingSongNumber);
    var $lastSongNumberCell = getSongNumberCell(lastSongNumber);

    $nextSongNumberCell.html(pauseButtonTemplate);
    $lastSongNumberCell.html(lastSongNumber);
}

var previousSong = function() {
    var currentSongIndex = trackIndex(currentAlbum, currentSongFromAlbum);

// decrementing the song here
currentSongIndex--;

if (currentSongIndex < 0) {
  currentSongIndex = currentAlbum.songs.length - 1;
}

// Save the last song number before changing it
var lastSongNumber = currentlyPlayingSongNumber;



// Update the Player Bar information
    updatePlayerBarSong();

    $('.main-controls .play-pause').html(playerBarPauseButton);

    // Set a new current song
    setSong(currentSongIndex + 1);
    currentSoundFile.play();
    // update time when thumbing
    updateSeekBarWhileSongPlays();

    // Update song bar to pull from data
    var  updatePlayerBarSong = function() {
        $('.currently-playing .song-name').text(currentSongFromAlbum.title);
        $('.currently-playing .artist-name').text(currentAlbum.artist);
        $('.currently-playing .artist-song-mobile').text(currentSongFromAlbum.title + " - " + currentAlbum.artist);
        $('.main-controls .play-pause').html(playerBarPauseButton);

    };

    var lastSongNumber = getLastSongNumber(currentSongIndex);
    var $nextSongNumberCell = getSongNumberCell(currentlyPlayingSongNumber);
    var $lastSongNumberCell = getSongNumberCell(lastSongNumber);

    $previousSongNumberCell.html(pauseButtonTemplate);
    $lastSongNumberCell.html(lastSongNumber);
};
var updatePlayerBarSong = function() {
     $('.currently-playing .song-name').text(currentSongFromAlbum.title);
     $('.currently-playing .artist-name').text(currentAlbum.artist);
     $('.currently-playing .artist-song-mobile').text(currentSongFromAlbum.title + " - " + currentAlbum.artist);

      // Updates the HTML of the play/pause button
      $('.main-controls .play-pause').html(playerBarPauseButton);

     // Set the total song time for currently playing song
     var setTotalTimeInPlayerBar = function(totalTime) {
         $('.seek-control .total-time').text(timeCode(totalTime));
     };

     $('.currently-playing .seek-control .total-time').text(setTotalTimeInPlayerBar(currentSongFromAlbum.duration));
 };

 var timeCode = function(timeInSeconds) {
     var argSeconds = Math.floor(parseFloat(timeInSeconds));

     var minutes = Math.floor(argSeconds / 60);
     var seconds = argSeconds % 60;

     if (seconds < 10) {
         return minutes + ":0" + seconds;
     } else {
         return minutes + ":" + seconds;
     }
  };

  var togglePlayFromPlayerBar = function() {
    var currentlyPlayingCell = getSongNumberCell(currentlyPlayingSongNumber);

      if(currentSoundFile.isPaused()) {
        currentlyPlayingCell.html(pauseButtonTemplate);
        $playPauseButton.html(playerBarPauseButton);
        currentSoundFile.play();
      } else {
        currentlyPlayingCell.html(playButtonTemplate);
        $playPauseButton.html(playerBarPlayButton);
        currentSoundFile.pause();
      }
  };
   // Elements to which we'll be adding listeners
   var songListContainer = document.getElementsByClassName('album-view-song-list')[0];
   var songRows = document.getElementsByClassName('album-view-song-item');

   // Album button templates
   var playButtonTemplate = '<a class="album-song-button"><span class="ion-play"></span></a>';
   var pauseButtonTemplate = '<a class="album-song-button"><span class="ion-pause"></span></a>';
   var playerBarPlayButton = '<span class="ion-play"></span>';
   var playerBarPauseButton = '<span class="ion-pause"></span>';

   // Store state of playing songs
   var currentAlbum = null;
   var currentlyPlayingSongNumber = null;
   var currentSongFromAlbum = null;
   var currentSoundFile = null;
   var currentVolume = 80;

   var $previousButton = $('.main-controls .previous');
   var $nextButton = $('.main-controls .next');
   var $playPauseButton = $('.main-controls .play-pause');
   var $albumImage = $('.album-cover-art');

  $(document).ready(function() {


      setCurrentAlbum(albumPicasso);
      setupSeekBars();

      $previousButton.click(previousSong);
      $nextButton.click(nextSong);

      $playPauseButton.click(togglePlayFromPlayerBar);
      var albums = [albumPicasso, albumMarconi, albumLumineers];
      var index = 0;

      $albumImage.click(function() {
              setCurrentAlbum(albums[index]);
                index++;

          if (index == albums.length) {
              index = 0;
          }
      });
  });

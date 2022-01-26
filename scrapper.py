import json
from youtube_search import YoutubeSearch
from youtubesearchpython import Playlist
import requests
import re
import threading

maxThreads = 50

def fetchID(query):
    return re.findall(r"watch\?v=(\S{11})", requests.get("https://www.youtube.com/results?search_query="+query.replace(" ", "+")).text)[0]

def fetchThread(queries, responses):
    for query in queries:
        responses[query[1]] = fetchID(query[0])

def multYoutubeSearch(queries, total):
    responses = ['NONE' for i in range(total)]
    while 'NONE' in responses:
        threadInputs = [[] for i in range(maxThreads)]
        threads = []
        for i in range(total):
            if responses[i] == 'NONE':
                threadInputs[i % maxThreads].append([queries[i], i])
        for i in range(min(total, maxThreads)):
            newThread = threading.Thread(target=fetchThread, args=([threadInputs[i], responses]))
            newThread.start()
            threads.append(newThread)
        for i in threads:
            i.join()
    return responses

def querySearch(query, maxresults=10):
    results = json.loads(YoutubeSearch(query, max_results=maxresults).to_json())
    songs = []
    for video in results['videos']:
        song = {
            "youtube-id": video['id'],
            'thumbnail': video['thumbnails'][0],
            'name': video['title'],
            'duration': video['duration'],
            'views': video['views'],
            'artists': "NA",
            "album": "NA"
        }
        songs.append(song)
    return songs

def youtubePlaylist(playlistID):
    meta = Playlist.getInfo("https://www.youtube.com/playlist?list=" + playlistID)
    playlist = {
        "type": "playlist",
        "playlistType": "Youtube",
        "name": meta["title"],
        "description": "",
        "owner": meta["channel"]["name"],
        "thumbnail": meta["thumbnails"][-1]['url'],
        "url": "https://www.youtube.com/playlist?list=" + playlistID,
        "tracks": meta['videoCount'],
        "songs": [],
        "complete-load": False,
    }
    for song in Playlist.getVideos(playlist["url"])['videos']:
        curr = {
            "name": song['title'],
            "album": "NA",
            "artists": "NA",
            "thumbnail": song['thumbnails'][-1]['url'],
            "query": song['accessibility']['title'],
            "youtube-id": song['id'],
            "duration": song['duration']
        }
        playlist["songs"].append(curr)
    playlist["complete-load"] = True
    playlist["error"] = None

    return playlist

def spotifyPlaylist(playlistID):
    token = requests.get('https://open.spotify.com/get_access_token?reason=transport&productType=web_player').json()['accessToken']
    headers = {"authorization": "Bearer " + token}
    url = f"https://api.spotify.com/v1/playlists/{playlistID}?fields=collaborative%2Cdescription%2Cfollowers%28total%29%2Cimages%2Cname%2Cowner%28display_name%2Cid%2Cimages%2Curi%29%2Cpublic%2Ctracks%28items%28track.type%2Ctrack.duration_ms%29%2Ctotal%29%2Curi&additional_types=track%2Cepisode&market=IN"
    url2 = f"https://api.spotify.com/v1/playlists/{playlistID}/tracks?offset=0&limit=100"
    meta = requests.get(url, headers=headers).json()
    playlist = {
        "type": "playlist",
        "playlistType": "Spotify",
        "name": meta['name'],
        "description": meta['description'],
        "owner": meta['owner']['display_name'],
        "thumbnail": meta['images'][0]['url'],
        "url": "https://open.spotify.com/playlist/" + playlistID,
        "tracks": meta['tracks']['total'],
        "songs": [],
        "complete_load": False,
    }
    queries = []
    while url2 != None:
        songs = requests.get(url2, headers=headers).json()
        url2 = songs['next']
        for song in songs['items']:
            curr = {
                "name": song['track']['name'],
                "album": song['track']['album']['name'],
                "artists": ','.join([artist['name'] for artist in song['track']['artists']]),
                "thumbnail": song['track']['album']['images'][0]['url'],
                "query": song['track']['name'] + " " + ' '.join([artist['name'] for artist in song['track']['artists']]),
                "duration": "NA",
            }
            queries.append(curr['query'])
            playlist['songs'].append(curr)

    responses = multYoutubeSearch(queries, playlist['tracks'])
    for i in range(playlist['tracks']):
        playlist['songs'][i]['youtube-id'] = responses[i]
    playlist["complete-load"] = True
    playlist["error"] = None

    return playlist

def scrapePlaylist(url):
    youtube = "www.youtube.com/playlist?list="
    spotify = "open.spotify.com/playlist/"
    playlist = {"Error": None}
    try:
        if youtube in url:
            playlistID = url.split(youtube)[1].split("&")[0].split("?")[0]
            playlist = youtubePlaylist(playlistID)
        elif spotify in url:
            playlistID = url.split(youtube)[1].split("&")[0].split("?")[0]
            playlist = spotifyPlaylist(playlistID)
        else:
            playlist["Error"] = "Playlist platform not yet supported, Try Youtube or Spotify playlist 😔"
    except Exception as e:
        playlist["Error"] = "Playlist error = " + e
    return playlist

def youtubeLink(q):
    
    results = json.loads(YoutubeSearch(q, max_results=1).to_json())
    
    video = results['videos'][0]
    song = {
        "youtube-id": video['id'],
        'thumbnail': video['thumbnails'][0],
        'name': video['title'],
        'duration': video['duration'],
        'views': video['views'],
        'artists': "NA"
    }

    return song

if __name__ == "__main__":
    youtubePlaylist("PLrtx_ZprDtppkvHunsLeRSJT4t0cUTPTk")
    print("#Code by jrke")
import json
from youtube_search import YoutubeSearch
from youtubesearchpython import Playlist, Video, ResultMode
import requests
import re
import threading
from bs4 import BeautifulSoup

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

def querySpotSearch(query, maxresults=7):
    token = requests.get('https://open.spotify.com/get_access_token?reason=transport&productType=web_player').json()['accessToken']
    headers = {"authorization": "Bearer " + token}

    search = requests.get(
        'https://api.spotify.com/v1/search',
        headers=headers,
        params={ 'q': query, 'type': 'track' }).json()

    songs = []
    for song in search['tracks']['items'][:maxresults]:
        curr =  {
            "name": song['name'],
            "album": song['album']['name'],
            "thumbnail": song['album']['images'][1]['url'],
            "artists": ','.join([artist['name'] for artist in song['artists']]),
            "duration": "NA",
        }
        curr['youtube-id'] = fetchID(curr['name'] + " song " + curr['artists'] + " " + curr['album'])
        songs.append(curr)

    return songs

def querySearch(query):
    ytload = 15
    spotload = 7

    results = json.loads(YoutubeSearch(str(query) + " song", max_results=ytload).to_json())
    songs = []
    for video in results['videos']:
        splits = str(video['duration']).split(':')
        if len(splits) > 2:
            if len(splits) > 3:
                continue
            duration = (int(splits[0])*3600) + (int(splits[1])*60) + (int(splits[2]))
            if duration > 6300:
                continue
    
        song = {
            "youtube-id": video['id'],
            'thumbnail': video['thumbnails'][0],
            'name': video['title'],
            'duration': 'NA',
            'views': video['views'],
            'artists': "NA",
            "album": "NA"
        }
        songs.append(song)
    
    loaded = []
    ret = []
    spot = querySpotSearch(query, spotload)
    for i in range(max(ytload, spotload)):
        if i < len(song) and songs[i]['youtube-id'] not in loaded:
            ret.append(songs[i])
            loaded.append(songs[i]['youtube-id'])
        if i < len(spot) and spot[i]['youtube-id'] not in loaded:
            ret.append(spot[i])
            loaded.append(spot[i]['youtube-id'])

    return ret

def youtubePlaylist(playlistID):
    fetcher = Playlist(f'https://www.youtube.com/playlist?list={playlistID}')
    
    meta = fetcher.info['info']
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
    while fetcher.hasMoreVideos:
        fetcher.getNextVideos()
    for song in fetcher.videos:
        curr = {
            "name": song['title'],
            "album": "NA",
            "artists": "NA",
            "thumbnail": song['thumbnails'][-1]['url'],
            "query": song['accessibility']['title'],
            "youtube-id": song['id'],
            "duration": 'NA'
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
            try:
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
            except:
                playlist['tracks'] -= 1
                #SONG DELETED FROM SPOTIFY

    responses = multYoutubeSearch(queries, playlist['tracks'])
    added = []
    r = 0
    for i in range(playlist['tracks']):
        x = i - r
        if responses[i] in added:
            playlist['songs'].pop(x)
            r += 1
        else:
            playlist['songs'][x]['youtube-id'] = responses[i]
            added.append(responses[i])

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
    link = f"http://www.youtube.com/watch?v={q}"
    video = Video.getInfo(link, mode = ResultMode.json)
    v = video['viewCount']['text']
    v = v[::-1]
    views = ""
    for i in range(len(v)):
        if i%3 == 0:
            views += ","
        views += v[i]
    views = views[::-1] + " views"

    song = {
        "youtube-id": video['id'],
        'thumbnail': video['thumbnails'][-1]['url'],
        'name': video['title'],
        'duration': 'NA',
        'views': views,
        'artists': "NA",
        "album": "NA",
        "type": "youtube",
        "track": video['id']
    }

    return song

def spotifyLink(track):
    html = requests.get(f"https://open.spotify.com/track/{track}").text
    soup = BeautifulSoup(html , 'html.parser')
    name = str(soup.find_all("meta", attrs={"property": "og:title"})[0]).replace("<meta content=", "")[1:].replace(' property="og:title"/>', "")[:-1]
    url = str(soup.find_all("meta", attrs={"property": "og:image"})[0]).split('"')[1]
    artists = ','.join(str(soup.find_all('title')[0]).split("by ")[1].replace(" | Spotify</title>", "").split(", "))
    query = name + " " + artists.replace(",", " ")
    url2 = str(soup.find_all("meta", attrs={"name": "music:album"})[0]).split('"')[1]
    html = requests.get(url2).text
    soup = BeautifulSoup(html , 'html.parser')
    album = str(soup.find_all("meta", attrs={"property": "og:title"})[0]).replace("<meta content=", "")[1:].replace(' property="og:title"/>', "")[:-1]
    
    song = {
        "youtube-id": multYoutubeSearch([query], 1)[0],
        "name": name,
        "thumbnail": url,
        "artists": artists,
        "duration": "NA",
        "album": album,
        "type": "spotify",
        "track": track,
    }

    return song

if __name__ == "__main__":
    youtubeLink("Uvj827SqHak")
    print("Test 1 done")
    spotifyLink("6uQkoo1UGWThtEpNEYc6Ga")
    print("Test 2 done")
    youtubePlaylist("PLrtx_ZprDtppkvHunsLeRSJT4t0cUTPTk")
    print("Test 3 done")
    spotifyPlaylist("3etBVbyq64Paw9OfL9QI9y")
    print("Test 4 done")
    
    print("#Code by jrke")

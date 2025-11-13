# Google Calendar Sync

## Setup

In order to create events to Google Calendar, it requires creating a project, enable an API, creating a service account, 
enabled keys for the service account and then your able to interact with the service through the API SDK. 
This is pretty universal across all Google services, so can easily be expanded beyond just Calendar.

* Open [google console](https://accounts.google.com/v3/signin/identifier?continue=https%3A%2F%2Fconsole.cloud.google.com%2F&followup=https%3A%2F%2Fconsole.cloud.google.com%2F&ifkv=AdBytiM_asQEUZ6xS0oGhIS8DE-inVNOhVSiaStVYEkfM4RlXBD8cVXEb-VUAS216dk7d5n6KTCV&osid=1&passive=1209600&service=cloudconsole&flowName=WebLiteSignIn&flowEntry=ServiceLogin&dsh=S406225306%3A1753261933075804) 
and in the project dropdown, select "New Project". Give the project a name and click create.
  * Verify that your on your project dashboard page. Click on **APIs & Services** and then click **Enable APIS and Services**
  * The API library will be displayed.  Search for **Calendar** and select **Google Calendar API**
  * Google Calendar details will be displayed, click on **enable** to add this API to your project
* Next we create the service account.  Click on "Create Credentials".
  * Select "Google Calendar API" as a type of API for the credential
  * You'll be asked about the data being accessed, click on "Application Data" and then "Next"
  * Enter an account named and then click "Create and Continue"
  * We will be using the "Owner" role for giving access to the service account
  * Next step is optional and is about administrative rights.  Choose whatever and click "Done"
* Now we need to add credentials to the service account.  Click on the email link
  * Go to the "Keys" tab and click on "Add Key"
  * Select "JSON" as the key type and click "Create"
  * The file is automatically downloaded, which contains unique ID's and private key - known as service key file
* Get the project number, by clicking on the 3 dot menu option at the top right and click "Project Settings"
  * Copy the project number for later use
* Now we need to setup a Google Calendar and retrieve it's ID.  Go to [Google Calendar](https://accounts.google.com/v3/signin/identifier?continue=https%3A%2F%2Fcalendar.google.com%2Fcalendar%2Fu%2F0%2Fr&emr=1&followup=https%3A%2F%2Fcalendar.google.com%2Fcalendar%2Fu%2F0%2Fr&ifkv=AdBytiOYAG_jb1PKhl6YdeX1Xlljj6ASoqEJNylr06xkYIkI4izpxH25qew25B3S8stmj0CwpqCG&osid=1&passive=1209600&service=cl&flowName=WebLiteSignIn&flowEntry=ServiceLogin&dsh=S907226061%3A1753261933069178)
  * Create a new calendar by clicking the "+" beside "Other Calendars"
  * Enter name and description and click "Create Calendar"
  * Click on the 3 dot menu beside the newly created calendar and click on "Settings and Sharing"
  * Scroll down to the "Integrate calendar" section and copy the Calendar ID. Store it for later use.
  * Open the service key file and copy the value set for "client email"
  * Go to the "Share with specific people" section and click "Add People" and then paste the client email address.

Now your Google account should be properly setup to allow interaction with the Calendar service, as well as created 
the service account with credentials that we can authenticate and authorize requests with.

Google Python library
- googleapiclient
- pip install --upgrade google-api-python-client google-auth-httplib2 google-auth-oauthlib

Calendar Event Fields
https://developers.google.com/workspace/calendar/api/v3/reference/events#id

Event insert
https://developers.google.com/workspace/calendar/api/v3/reference/events/insert

Service account setup
https://medium.com/iceapple-tech-talks/integration-with-google-calendar-api-using-service-account-1471e6e102c8


```python
import datetime
import os.path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# If modifying these scopes, delete the file token.json.
SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"]


def main():
"""Shows basic usage of the Google Calendar API.
Prints the start and name of the next 10 events on the user's calendar.
"""
creds = None
# The file token.json stores the user's access and refresh tokens, and is
# created automatically when the authorization flow completes for the first
# time.
if os.path.exists("token.json"):
creds = Credentials.from_authorized_user_file("token.json", SCOPES)
# If there are no (valid) credentials available, let the user log in.
if not creds or not creds.valid:
if creds and creds.expired and creds.refresh_token:
creds.refresh(Request())
else:
flow = InstalledAppFlow.from_client_secrets_file(
"credentials.json", SCOPES
)
creds = flow.run_local_server(port=0)
# Save the credentials for the next run
with open("token.json", "w") as token:
token.write(creds.to_json())

try:
service = build("calendar", "v3", credentials=creds)

    # Call the Calendar API
    now = datetime.datetime.now(tz=datetime.timezone.utc).isoformat()
    print("Getting the upcoming 10 events")
    events_result = (
        service.events()
        .list(
            calendarId="primary",
            timeMin=now,
            maxResults=10,
            singleEvents=True,
            orderBy="startTime",
        )
        .execute()
    )
    events = events_result.get("items", [])

    if not events:
      print("No upcoming events found.")
      return

    # Prints the start and name of the next 10 events
    for event in events:
      start = event["start"].get("dateTime", event["start"].get("date"))
      print(start, event["summary"])

except HttpError as error:
print(f"An error occurred: {error}")


if __name__ == "__main__":
main()
```

Create an event
```python
# Refer to the Python quickstart on how to setup the environment:
# https://developers.google.com/workspace/calendar/quickstart/python
# Change the scope to 'https://www.googleapis.com/auth/calendar' and delete any
# stored credentials.

event = {
  'summary': 'Google I/O 2015',
  'location': '800 Howard St., San Francisco, CA 94103',
  'description': 'A chance to hear more about Google\'s developer products.',
  'start': {
    'dateTime': '2015-05-28T09:00:00-07:00',
    'timeZone': 'America/Los_Angeles',
  },
  'end': {
    'dateTime': '2015-05-28T17:00:00-07:00',
    'timeZone': 'America/Los_Angeles',
  },
  'recurrence': [
    'RRULE:FREQ=DAILY;COUNT=2'
  ],
  'attendees': [
    {'email': 'lpage@example.com'},
    {'email': 'sbrin@example.com'},
  ],
  'reminders': {
    'useDefault': False,
    'overrides': [
      {'method': 'email', 'minutes': 24 * 60},
      {'method': 'popup', 'minutes': 10},
    ],
  },
}

event = service.events().insert(calendarId='primary', body=event).execute()
print 'Event created: %s' % (event.get('htmlLink'))
```

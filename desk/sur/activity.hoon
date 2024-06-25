/-  c=channels, ch=chat, g=groups
/+  mp=mop-extensions
|%
+|  %collections
::  $stream: the activity stream comprised of events from various agents
+$  stream  ((mop time event) lte)
::  $indices: the stream and its read data split into various indices
+$  indices  (map source index)
::  $volume-settings: the volume settings for each source
+$  volume-settings  (map source volume-map)
::  $activity: the current state of activity for each source
+$  activity  (map source activity-summary)
::  $full-info: the full state of the activity stream
+$  full-info  [=indices =activity =volume-settings]
::  $volume-map: how to badge and notify for each event type
+$  volume-map
  $~  default-volumes
  (map event-type volume)
::  $feed: a set of grouped events
+$  feed  (list activity-bundle)
+|  %actions
::  $action: how to interact with our activity stream
::
::    actions are only ever performed for and by our selves
::
::    $add: add an event to the stream
::    $del: remove a source and all its activity
::    $read: mark an event as read
::    $adjust: adjust the volume of an source
::    $allow-notifications: change which notifications are allowed
::
+$  action
  $%  [%add =incoming-event]
      [%del =source]
      [%read =source =read-action]
      [%adjust =source =(unit volume-map)]
      [%allow-notifications allow=notifications-allowed]
  ==
::
::  $read-action: mark activity read
::
::    $item: mark an individual activity as read, indexed by id
::    $event: mark an individual activity as read, indexed by the event itself
::    $all: mark _everything_ as read for this source
::
+$  read-action
  $%  [%item id=time-id]
      [%event event=incoming-event]
      [%all time=(unit time)]
  ==
::
+|  %updates
::
::  $update: what we hear after an action
::
::    $add: an event was added to the stream
::    $del: a source and its activity were removed
::    $read: a source's activity state was updated
::    $adjust: the volume of a source was adjusted
::    $allow-notifications: the allowed notifications were changed
::
+$  update
  $%  [%add =source time-event]
      [%del =source]
      [%read =source =activity-summary]
      [%adjust =source volume-map=(unit volume-map)]
      [%allow-notifications allow=notifications-allowed]
  ==
::
+|  %basics
::  $event: a single point of activity, from one of our sources
::
::    $incoming-event: the event that was sent to us
::    $notified: if this event has been notified
::    $child: if this event is from a child source
::
+$  event
  $:  incoming-event
      notified=?
      child=?
  ==
+$  incoming-event
  $%  [%post post-event]
      [%reply reply-event]
      [%dm-invite =whom]
      [%dm-post dm-post-event]
      [%dm-reply dm-reply-event]
      [%group-ask group=flag:g =ship]
      [%group-kick group=flag:g =ship]
      [%group-join group=flag:g =ship]
      [%group-invite group=flag:g =ship]
      [%chan-init channel=nest:c group=flag:g]
      [%group-role group=flag:g =ship roles=(set sect:g)]
      [%flag-post key=message-key channel=nest:c group=flag:g]
      [%flag-reply key=message-key parent=message-key channel=nest:c group=flag:g]
  ==
::
+$  post-event
  $:  key=message-key
      channel=nest:c
      group=flag:g
      content=story:c
      mention=?
  ==
::
+$  reply-event
  $:  key=message-key
      parent=message-key
      channel=nest:c
      group=flag:g
      content=story:c
      mention=?
  ==
::
+$  dm-post-event
  $:  key=message-key
      =whom
      content=story:c
      mention=?
  ==
::
+$  dm-reply-event
  $:  key=message-key
      parent=message-key
      =whom
      content=story:c
      mention=?
  ==
::
::  $source: where the activity is happening
+$  source
  $%  [%base ~]
      [%group =flag:g]
      [%channel =nest:c group=flag:g]
      [%thread key=message-key channel=nest:c group=flag:g]
      [%dm =whom]
      [%dm-thread key=message-key =whom]
  ==
::
::  $index: the stream of activity and read state for a source
+$  index  [=stream =reads]
::
::  $reads: the read state for a source
::
::    $floor: the time of the latest event that was read
::    $items: the set of events above the floor that have been read
::
+$  reads
  $:  floor=time
      items=read-items
  ==
+$  read-items  ((mop time-id ,~) lte)
::  $activity-summary: the summary of activity for a source
::
::    $newest: the time of the latest activity read or unread
::    $count: the total number of unread events including children
::    $notify: if there are any notifications here or in children
::    $unread: if the main stream of source is unread: which starting
::             message, how many there are, and if any are notifications
::    $children: the sources nested under this source
::
+$  activity-summary
  $~  [*@da 0 | ~ ~]
  $:  newest=time
      count=@ud
      notify=_|
      unread=(unit unread-point)
      children=(unit (map source activity-summary))
  ==
+$  unread-point  [message-key count=@ud notify=_|]
+$  volume  [unreads=? notify=?]
+$  notifications-allowed  ?(%all %some %none)
+$  activity-bundle
  $:  =source
      latest=time
      events=(list time-event)
  ==
::
+|  %primitives
+$  whom
  $%  [%ship p=ship]
      [%club p=id:club:ch]
  ==
+$  time-id  time
+$  message-id   (pair ship time-id)
+$  message-key  [id=message-id =time]
::
+$  event-type
  $?  %chan-init
      %post
      %post-mention
      %reply
      %reply-mention
      %dm-invite
      %dm-post
      %dm-post-mention
      %dm-reply
      %dm-reply-mention
      %group-invite
      %group-kick
      %group-join
      %group-ask
      %group-role
      %flag-post
      %flag-reply
  ==
+|  %helpers
+$  time-event  [=time =event]
++  on-event        ((on time event) lte)
++  ex-event        ((mp time event) lte)
++  on-read-items   ((on time ,~) lte)
+|  %constants
++  default-volumes
  ^~
  ^-  (map event-type volume)
  %-  my
  :~  [%post & &]
      [%reply & |]
      [%dm-reply & &]
      [%post-mention & &]
      [%reply-mention & &]
      [%dm-invite & &]
      [%dm-post & &]
      [%dm-post-mention & &]
      [%dm-reply-mention & &]
      [%group-invite & &]
      [%group-ask & &]
      [%flag-post & &]
      [%flag-reply & &]
      [%group-kick & |]
      [%group-join & |]
      [%group-role & |]
  ==
++  old-volumes
  ^~
  %-  my
  :~  [%soft (~(put by default-volumes) %post [& |])]
      [%loud (~(run by default-volumes) |=([u=? *] [u &]))]
      [%hush (~(run by default-volumes) |=([u=? *] [u |]))]
  ==
++  mute
  ^~
  (~(run by default-volumes) |=(* [| |]))
--
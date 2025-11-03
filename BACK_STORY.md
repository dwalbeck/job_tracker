# Why build this application?

So I found myself in a position where I was looking for a job.  It had been a while since I had been job hunting  
and I came to find that the whole job hunting space for computer programmers had drastically changed.  With the 
advent of AI, finding a job was no longer what it once was.  I searched for a job for a good couple of months, and 
wasn't making much ground, so I signed up for a professional service (which I will not call out by name), which wasn't 
cheap (around \$5500).  They rewrote my resume and built me a website, nothing fancy but laid out cleanly.  They also 
provided one-on-one with a dedicated agent that would help with whatever it is you needed, like learning how to 
optimize LinkedIn and lots of other tips and tricks.  Was it worth the \$5500 fee?  I don't know, but I was still 
jobless after months.  I've never in my life ever had a problem getting a job and at the most it took maybe a month 
of looking.

### The Problem

I sympathize with employers, who just wasnt a qualified person to perform a function at their company.  So they make 
a job posting and are instantly swamped with thousands of applicants.  They can even explicitly state in the posting 
that applicants must be a US citizen and live within the US, but that doesn't reduce the volume of applicants that 
they will receive.  This is largely due to so many automated services, that has AI rewriting resumes and automatically 
submitting people for any type of job even remotely related.  It will rewrite resume content, fabricating experience 
and adding technologies - all with one goal in mind... score high with the ATS system.

ATS is used by employers as a way to filter unqualified candidates through the use of keywords.  It scans the job 
posting, pulling out important technologies, languages, traits and whatnot.  Each resume that comes in is then scanned 
as well and given a score.  The employer will set a threshold, say 85% for example.  Any applicant not scoring at least 
85% gets dropped before they even have a chance to talk to anyone.  I understand the need for such a process, as the 
shear amount of time and resources to properly vet thousands of candidates is a lot.

Now the flip side of that, from the candidate viewpoint.  For someone like me, that has close to 25 years of experience 
programming, over the course of that time I've used many different languages, methodologies, platforms and integrated 
with thousands of systems and programs using thousands of different software tools.  There are of course many of those 
I no longer use or haven't used in many years, so I of course don't include those on my resume.  Still, if I only 
created a list just stating the name of something I knew how to do, for example - let's limit it to just Apache 
Foundation projects.  The list would look like: 

ActiveMQ, AsteriskDB, Axiom, Avro, bRPC, Cassandra, CloudStack, CouchDB, Directory, Flex, Geode, Gobblin, Grails, 
HBase, Hive, HoraeDB, Apache HTTP Server, Iceberg, Jakarta Cactus, Juneau, Kafka, Log4j, Lucene Core, Maven, 
NetBearns, OpenNLP, OpenOffice, Parquet, PDFBox, Pinot, PyLucene, Regexp, RocketMQ, Sling, Solr, SpamAssassin, Spark 
Steampipes, Struts, Subversion, Synapse, Tomcat, Torque, Traffic Control, Traffic Server, Websh, Wicket, XML Commons

The sad thing is, I probably know more, but didn't know the name. I don't list this to brag or flaunt, but rather 
to make a point. Maybe a company has interest in some of these skills, but more likely that they don't.  That's a 
whole paragraph, and it's just on this one small sliver of software projects, with hundreds of thousands more out there.  
It's not reasonable for someone like me to even try to list all the technologies that I've used.  There would be no 
room for any other content if I did that.  So my resume isn't going to score great against ATS scoring - not because 
I don't know the obscure technology that a posting happen to include, but because I didn't have room to list everything.

### The Game

So for me logically, things kind of came down to a numbers game.  If I was only getting contacted on around 5 - 10% of 
job postings that I had submitted to, then I needed to do two things.  First I needed to tune each resume to match the 
job posting, so I scored higher, and the other things was I needed to increase the jobs I applied for. That's one thing 
this expensive service I paid for did, was they had a nice online tool where I could enter the job posting and it 
would rewrite my resume to score better and help me track submissions.  And this online tool was the biggest value 
from this service, as it helped me keep track of each job I applied for, let me add notes, contacts and created 
cover letters for me when needed.

The more I used this online tool, the more I wish it did more, or did things differently.  My subscription was just about 
over and I needed something to be able to add in tracking jobs applied to, as well as tune up my resume custom for 
each job.  So I started coding at first just a tool to tune up my resume specific for each job.  This quickly led to 
issues with AI being able to read document types, which it wasn't the greatest at.  It was however pretty good at reading 
Markdown, so I lost some of my nice professional document styling, to gain consistency with the content, which 
ultimately was what mattered the most.

At any rate, it's unfortunate that employers are in the position that they are in, but it seems amplified downstream to 
the candidates.  It's a silly unnecessary game, but if you don't play, then you'll end up never getting the chance to 
talk to real people at companies hiring.  This tool has been a big help to me, so I thought I would go ahead and make it 
available for everyone to use if they so choose.


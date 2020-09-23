.DEFAULT_GOAL := start

build:
	rm -r dist/ && rm -r node_modules/
	docker build -t frenzy-slack-bot .

stop:
	docker stop frenzy-slack-bot
	docker rm frenzy-slack-bot

start:
	docker run -d \
	--name frenzy-slack-bot \
	--restart=always \
	--publish 3000:3000 \
	--env-file .env \
	frenzy-slack-bot:latest

update: stop build start
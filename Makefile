.DEFAULT_GOAL := start

build:
	rm -rf dist/ && rm -rf node_modules/
	docker build -t frenzy-slack-bot .

stop:
	docker stop frenzy-slack-bot
	docker rm frenzy-slack-bot

start:
	./make-env.sh
	docker run -d \
	--name frenzy-slack-bot \
	--restart=always \
	--publish 3000:3000 \
	--env-file frenzy.env \
	frenzy-slack-bot:latest

pull:
	git pull

update: stop pull build start

attach:
	docker container attach frenzy-slack-bot

logs:
	docker container logs frenzy-slack-bot
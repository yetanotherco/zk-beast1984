

__WEB__: ## ____

web_start: web_start_db web_ecto_setup_db ## Start the Web with the database
	@cd web/ && \
		pnpm install --prefix assets && \
		mix setup && \
		./start.sh

web_build_db: ## Build the Web database image
	@cd web && \
		docker build -t zkarcade-postgres-image .

web_start_db: web_remove_db_container
	@cd web && \
		docker run -d --name zkarcade-postgres-container -p 5432:5432 -v zkarcade-postgres-data:/var/lib/postgresql/data zkarcade-postgres-image

web_ecto_setup_db:
		@cd web/ && \
		./ecto_setup_db.sh

web_remove_db_container:
	@cd web && \
		docker stop zkarcade-postgres-container || true  && \
		docker rm zkarcade-postgres-container || true

web_clean_db: web_remove_db_container ## Remove the Web database container and volume
	@cd web && \
		docker volume rm zkarcade-postgres-data || true

web_dump_db: ## Dump the Web database to a file
	@cd web && \
		docker exec -t zkarcade-postgres-container pg_dumpall -c -U zkarcade_user > dump.$$(date +\%Y\%m\%d_\%H\%M\%S).sql
	@echo "Dumped database successfully to /web"

web_recover_db: web_start_db ## Recover the Web database from a dump file
	@read -p $$'\e[32mEnter the dump file to recover (e.g., dump.20230607_123456.sql): \e[0m' DUMP_FILE && \
	cd web && \
	docker cp $$DUMP_FILE zkarcade-postgres-container:/dump.sql && \
	docker exec -t zkarcade-postgres-container psql -U zkarcade_user -d zkarcade_db -f /dump.sql && \
	echo "Recovered database successfully from $$DUMP_FILE"

web_create_env:
	@cd web && \
	cp .env.dev .env

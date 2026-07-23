package com.alzheimer.questionnaire_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class QuestionnaireServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(QuestionnaireServiceApplication.class, args);
	}

}

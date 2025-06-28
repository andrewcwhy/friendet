import { createFileRoute } from "@tanstack/solid-router";

export const Route = createFileRoute("/about")({
	component: About,
});

type TeamMember = {
	firstName: string;
	lastName: string;
	age: number;
	github: string;
	linkedin: string;
};

const team: TeamMember[] = [
	{
		firstName: "Andrew",
		lastName: "Young",
		age: 19,
		github: "https://github.com/andrewcwhy",
		linkedin: "https://linkedin.com/in/youngandrewchristian",
	},
	{
		firstName: "Aditya",
		lastName: "Khera",
		age: 19,
		github: "https://github.com/andrewcwhy",
		linkedin: "https://linkedin.com/in/youngandrewchristian",
	},
	{
		firstName: "Ryan",
		lastName: "Rodriguez",
		age: 21,
		github: "https://github.com/andrewcwhy",
		linkedin: "https://linkedin.com/in/youngandrewchristian",
	},
	{
		firstName: "Conor",
		lastName: "Daly",
		age: 21,
		github: "https://github.com/andrewcwhy",
		linkedin: "https://linkedin.com/in/youngandrewchristian",
	},
];

function About() {
	return (
		<main class="max-w-6xl mx-auto p-8">
			<h1 class="text-3xl font-bold mb-8">Our Team</h1>
			<div class="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
				{team.map((member) => (
					<TeamCard member={member} />
				))}
			</div>
		</main>
	);
}

function TeamCard(props: { member: TeamMember }) {
	const { firstName, lastName, age, github, linkedin } = props.member;

	return (
		<div class="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 border border-gray-200 dark:border-gray-700">
			<h2 class="text-xl font-semibold mb-1">
				{firstName} {lastName}
			</h2>
			<p class="text-sm text-gray-600 dark:text-gray-300">
				University of Central Florida
			</p>
			<p class="text-sm text-gray-500 dark:text-gray-400">Age: {age}</p>
			<div class="mt-3 flex gap-3 text-blue-600 dark:text-blue-400 text-sm">
				<a href={github} target="_blank" rel="noopener noreferrer">
					GitHub
				</a>
				<a href={linkedin} target="_blank" rel="noopener noreferrer">
					LinkedIn
				</a>
			</div>
		</div>
	);
}

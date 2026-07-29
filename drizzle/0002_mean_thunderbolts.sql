CREATE TABLE `access_links` (
	`id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`owner_key` text NOT NULL,
	`label` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`last_used_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `access_links_token_hash_uq` ON `access_links` (`token_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `access_links_owner_key_uq` ON `access_links` (`owner_key`);--> statement-breakpoint
INSERT INTO `access_links` (`id`, `token_hash`, `owner_key`, `label`) VALUES
('access-01', '7b5f2f57b99da971bf455d3da748ffd7336730043be90adf4c2ff0d7d71a561a', 'beta-01', 'Participante 01'),
('access-02', 'db495cd6fc8a38f42e61a25c700a5fc3bbadad3ce1f1887ddb10ade653f76a9d', 'beta-02', 'Participante 02'),
('access-03', '0dd5048f8063263698eedbfe8d0de9a673410a46665016d5dc3194a136eb6808', 'beta-03', 'Participante 03'),
('access-04', '6107e30b5057674976146456eba95928a037090c9cc51fb589d909e234a1153a', 'beta-04', 'Participante 04'),
('access-05', 'ba17e7bf07cbbcc09ef1fe6eaf094a2f62cb399a93167384362a548abb81ba30', 'beta-05', 'Participante 05'),
('access-06', '9c00e7f667a6b06dc6b460223d9e783df0bfea736c07f033e361105685151ef0', 'beta-06', 'Participante 06'),
('access-07', '225f129c45f095db2ae4c119d523f2f41a5960aef086807c799894672b8dcf2e', 'beta-07', 'Participante 07'),
('access-08', '5ccf5f7335e1256eb51649561b335afa7658e04cc2789f13dabd439943a15c91', 'beta-08', 'Participante 08'),
('access-09', 'e170adc37aed9df8476d91b503c796f1d55a9b34b5372bdeac59ba5c997f8934', 'beta-09', 'Participante 09'),
('access-10', 'ee5f568a2146e66486274f0291a5e26d1b33d71f0856b936c03a09cd49e9c51e', 'beta-10', 'Participante 10'),
('access-11', '40abb1751c41d4bfebb41b42e7ce22d6fa715f7d95932504f90953525a3411ab', 'beta-11', 'Participante 11'),
('access-12', '51b7242620154bab6f82d9609203ea46517f752dda30666193076474c60c8f81', 'beta-12', 'Participante 12'),
('access-13', 'b7f2cff128be5358037d1926d57ba41de8be8c28c9d9f86f33261309344b4781', 'beta-13', 'Participante 13'),
('access-14', '4520b1a54ea8eddc24b2ea62c1110fe50d7cebcc2013d85cfe9bccc8925a0bb9', 'beta-14', 'Participante 14'),
('access-15', '1ae762eea959381a53101493c2d3a9391224a9df6e7b8e39d0a05f725c0a1f54', 'beta-15', 'Participante 15'),
('access-16', '53d60d45e54322b3ac652df39e6b40f9b1fe696d638ea20f927796aee2022846', 'beta-16', 'Participante 16'),
('access-17', '771d54762ffa613cb7496edf84a6304bec8235752e932122738bf91414e6e63a', 'beta-17', 'Participante 17'),
('access-18', '626aaa75dd93ee39216b48a2b1fcc2f7d5569fdf94e4736eb4d13e2e1cc47332', 'beta-18', 'Participante 18'),
('access-19', 'ebed26e3f8f242152b3e0a4c834d4a68dc67c5453a8b7082c429848803295a44', 'beta-19', 'Participante 19'),
('access-20', '4d9a049ef90fc5c30ae77f1d2e83c72f1df11e5187fe8c10128bafe472dd977b', 'beta-20', 'Participante 20');

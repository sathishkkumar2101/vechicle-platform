INSERT INTO customers
(id, user_id, name, email, phone)
VALUES
    (
        'b7c4e6a1-3d52-4f8b-9c17-2a6e5d8f1043',
        '6683e0c9-cf0e-4963-acae-12020540b8ba',
        'Customer1',
        'customer1@bmwtechworks.com',
        '9876543210'
    ),
    (
        '4e91a7c3-8b26-45d0-a9f4-6c3b2e7158ad',
        '27aee71f-5655-40c5-a7e8-1bf2ec5752bc',
        'Customer2',
        'customer2@bmwtechworks.com',
        '9876543211'
    ),
    (
        'd2f8b461-7a35-4c90-b1e6-9d4a2f5837ce',
        'ddc6ca6e-9eeb-40a0-ad9f-0df5324072f6',
        'Customer3',
        'customer3@bmwtechworks.com',
        '9876543212'
    ),
    (
        '6a3e9d72-c518-4f04-b826-1d7c5a9e34bf',
        'c1928824-b7a1-4c0a-88dc-89f77f141f03',
        'Customer4',
        'customer4@bmwtechworks.com',
        '9876543213'
    )
    ON CONFLICT (id) DO NOTHING;


DELETE FROM customers_address;


INSERT INTO customers_address
(customers_id, address)
VALUES
    ('b7c4e6a1-3d52-4f8b-9c17-2a6e5d8f1043', 'Chennai, Tamil Nadu'),
    ('b7c4e6a1-3d52-4f8b-9c17-2a6e5d8f1043', 'India'),

    ('4e91a7c3-8b26-45d0-a9f4-6c3b2e7158ad', 'Bangalore, Karnataka'),
    ('4e91a7c3-8b26-45d0-a9f4-6c3b2e7158ad', 'India'),

    ('d2f8b461-7a35-4c90-b1e6-9d4a2f5837ce', 'Hyderabad, Telangana'),
    ('d2f8b461-7a35-4c90-b1e6-9d4a2f5837ce', 'India'),

    ('6a3e9d72-c518-4f04-b826-1d7c5a9e34bf', 'Mumbai, Maharashtra'),
    ('6a3e9d72-c518-4f04-b826-1d7c5a9e34bf', 'India');